package wtf.hackhub.application.idea;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.IdeaMutationLock;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.judging.JudgeScoreRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.util.List;
import java.util.UUID;

@Service
public class SubmitIdeaUseCase {
	private final IdeaMutationLock mutationLock;
	private final NomineeDirectory nomineeDirectory;

	private final IdeaRepository ideaRepository;
	private final JudgeScoreRepository judgeScoreRepository;
	private final ProfileRepository profileRepository;
	private final HackathonRepository hackathonRepository;
	private final TeamRepository teamRepository;
	private final TeamMemberRepository teamMemberRepository;
	private final OrganizationMemberRepository orgMemberRepository;

	public SubmitIdeaUseCase(IdeaRepository ideaRepository, HackathonRepository hackathonRepository,
			TeamRepository teamRepository, TeamMemberRepository teamMemberRepository,
			OrganizationMemberRepository orgMemberRepository, ProfileRepository profileRepository,
			IdeaMutationLock mutationLock, JudgeScoreRepository judgeScoreRepository,
			NomineeDirectory nomineeDirectory) {
		this.nomineeDirectory = nomineeDirectory;
		this.ideaRepository = ideaRepository;
		this.mutationLock = mutationLock;
		this.judgeScoreRepository = judgeScoreRepository;
		this.profileRepository = profileRepository;
		this.hackathonRepository = hackathonRepository;
		this.teamRepository = teamRepository;
		this.teamMemberRepository = teamMemberRepository;
		this.orgMemberRepository = orgMemberRepository;
	}

	@Transactional
	public Idea execute(String title, String description, UUID hackathonId, UUID teamId, UUID createdBy,
			String category, List<String> tags) {
		return executeNomination(title, description, hackathonId, teamId, createdBy, category, tags, Idea.Status.DRAFT,
				null, null, null);
	}

	@Transactional
	public Idea executeNomination(String title, String description, UUID hackathonId, UUID teamId, UUID createdBy,
			String category, List<String> tags, Idea.Status status, String repositoryUrl, String demoUrl,
			String projectAttachments) {

		// Validate hackathon exists
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new IdeaHackathonNotFoundException(hackathonId));

		if (teamId == null) {
			// Individual nominations do not require a team or an open team-registration window.
			var requester = profileRepository.findById(createdBy)
					.orElseThrow(() -> new IdeaAccessDeniedException(null, createdBy));
			if (requester.getRole() != Profile.Role.ADMIN && requester.getRole() != Profile.Role.MANAGER) {
				throw new IdeaAccessDeniedException(null, createdBy);
			}
		} else {
			// Preserve membership checks for legacy team submissions.
			var team = teamRepository.findById(teamId).orElseThrow(() -> new IdeaTeamNotFoundException(teamId));
			if (!team.getHackathonId().equals(hackathonId)) {
				throw new IdeaTeamHackathonMismatchException(teamId, hackathonId);
			}
			if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, createdBy)) {
				throw new IdeaAccessDeniedException(null, createdBy);
			}
		}

		// Validate user is org member (if hackathon has an org)
		if (hackathon.getOrganizationId() != null
				&& !orgMemberRepository.existsByOrganizationIdAndUserId(hackathon.getOrganizationId(), createdBy)) {
			throw new IdeaAccessDeniedException(null, createdBy);
		}

		tags = normalizeTags(tags);
		validateNominee(projectAttachments, createdBy);
		projectAttachments = nomineeDirectory.enrich(projectAttachments, true);
		Idea idea = new Idea(title, description, hackathonId, teamId, createdBy, category);
		idea.update(title, description, category, tags == null ? List.of() : tags,
				status == null ? Idea.Status.DRAFT : status, repositoryUrl, demoUrl, projectAttachments);
		return ideaRepository.save(idea);
	}

	@Transactional
	public Idea update(UUID ideaId, UUID requestingUserId, String title, String description, String category,
			List<String> tags, Idea.Status status, String repositoryUrl, String demoUrl, String projectAttachments) {
		mutationLock.acquire(ideaId);
		Idea idea = ideaRepository.findById(ideaId)
				.orElseThrow(() -> new VoteIdeaUseCase.IdeaNotFoundException(ideaId));
		if (!idea.getCreatedBy().equals(requestingUserId)) {
			throw new IdeaAccessDeniedException(ideaId, requestingUserId);
		}
		tags = normalizeTags(tags);
		validateNominee(projectAttachments, requestingUserId);
		projectAttachments = nomineeDirectory.enrich(projectAttachments, true);
		if (idea.getVotes() > 0 || !judgeScoreRepository.findAllByIdeaId(ideaId).isEmpty()) {
			Idea proposed = new Idea(title, description, idea.getHackathonId(), idea.getTeamId(), idea.getCreatedBy(),
					category);
			proposed.update(title, description, category, tags, idea.getStatus(), repositoryUrl, demoUrl,
					projectAttachments);
			if (!wtf.hackhub.domain.AwardTrack.normalize(idea.getCategory(), idea.getTags())
					.equals(wtf.hackhub.domain.AwardTrack.normalize(category, tags))
					|| !idea.getCategory().equalsIgnoreCase(category)
					|| !VoteIdeaUseCase.nomineeId(idea).equals(VoteIdeaUseCase.nomineeId(proposed))) {
				throw new IllegalArgumentException(
						"Track and nominee cannot change after voting or committee scoring has started");
			}
		}
		Idea.Status resolvedStatus = status != null ? status : idea.getStatus();
		idea.update(title, description, category, tags, resolvedStatus, repositoryUrl, demoUrl, projectAttachments);
		return ideaRepository.save(idea);
	}

	private static List<String> normalizeTags(List<String> tags) {
		if (tags == null)
			return List.of();
		List<String> normalized = tags.stream().filter(java.util.Objects::nonNull)
				.flatMap(tag -> java.util.Arrays.stream(tag.split("[,，、]")))
				.map(String::strip).filter(tag -> !tag.isEmpty()).distinct().toList();
		if (normalized.size() > 5)
			throw new IllegalArgumentException("Add up to 5 tags, separated by 、, ， or commas (,).");
		return normalized;
	}

	private void validateNominee(String attachments, UUID requesterId) {
		if (attachments == null || attachments.isBlank())
			return;
		try {
			var items = new ObjectMapper().readTree(attachments);
			if (items == null || !items.isArray())
				throw new IllegalArgumentException("Nomination attachments must be an array");
			int nominations = 0;
			for (var item : items) {
				if (!"nomination".equals(item.path("type").asText()))
					continue;
				if (++nominations > 1)
					throw new IllegalArgumentException("Only one nominee is allowed");
				UUID nomineeId = UUID.fromString(item.path("nomineeUserId").asText());
				if (!profileRepository.existsById(nomineeId))
					throw new IllegalArgumentException("Nominee profile not found");
				if (!nomineeId.equals(requesterId)) {
					var requester = profileRepository.findById(requesterId)
							.orElseThrow(() -> new IdeaAccessDeniedException(null, requesterId));
					if (requester.getRole() != Profile.Role.ADMIN && requester.getRole() != Profile.Role.MANAGER)
						throw new IdeaAccessDeniedException(null, requesterId);
				}
			}
		} catch (JsonProcessingException ex) {
			throw new IllegalArgumentException("Invalid nomination attachments");
		}
	}

	@Transactional
	public void delete(UUID ideaId, UUID requestingUserId) {
		deleteMany(List.of(ideaId), requestingUserId);
	}

	@Transactional
	public void deleteMany(List<UUID> ideaIds, UUID requestingUserId) {
		var requester = profileRepository.findById(requestingUserId)
				.orElseThrow(() -> new IdeaAccessDeniedException(null, requestingUserId));
		if (requester.getRole() != Profile.Role.ADMIN) {
			throw new IdeaAccessDeniedException(null, requestingUserId);
		}
		if (ideaIds == null || ideaIds.isEmpty() || ideaIds.stream().anyMatch(java.util.Objects::isNull)) {
			throw new IllegalArgumentException("Select at least one nomination to delete.");
		}
		// Stable lock order prevents overlapping batches from deadlocking with each other.
		var ids = ideaIds.stream().distinct().sorted().toList();
		ids.forEach(mutationLock::acquire);
		var ideas = ids.stream().map(id -> ideaRepository.findById(id)
				.orElseThrow(() -> new VoteIdeaUseCase.IdeaNotFoundException(id))).toList();
		// Existing foreign keys cascade votes, comments and scores in the same transaction.
		ideaRepository.deleteAll(ideas);
		ideaRepository.flush();
	}

	public static class IdeaAccessDeniedException extends RuntimeException {
		public IdeaAccessDeniedException(UUID id, UUID userId) {
			super("User " + userId + " does not have permission to submit or edit idea " + id);
		}
	}
	public static class IdeaHackathonNotFoundException extends RuntimeException {
		public IdeaHackathonNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}
	public static class IdeaTeamNotFoundException extends RuntimeException {
		public IdeaTeamNotFoundException(UUID id) {
			super("Team not found: " + id);
		}
	}
	public static class IdeaTeamHackathonMismatchException extends RuntimeException {
		public IdeaTeamHackathonMismatchException(UUID teamId, UUID hackathonId) {
			super("Team " + teamId + " does not belong to hackathon " + hackathonId);
		}
	}
}
