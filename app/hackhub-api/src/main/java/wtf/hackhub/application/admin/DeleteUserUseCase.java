package wtf.hackhub.application.admin;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import java.util.UUID;

@Service
public class DeleteUserUseCase {

	private final ProfileRepository profileRepository;

	public DeleteUserUseCase(ProfileRepository profileRepository) {
		this.profileRepository = profileRepository;
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public void execute(UUID targetUserId, UUID requestingUserId) {
		if (targetUserId.equals(requestingUserId)) {
			throw new AccessDeniedException("Administrators cannot delete their own account");
		}
		if (!profileRepository.existsById(targetUserId)) {
			throw new UserNotFoundException(targetUserId);
		}
		profileRepository.deleteById(targetUserId);
	}

	public static class UserNotFoundException extends RuntimeException {
		public UserNotFoundException(UUID id) {
			super("User not found: " + id);
		}
	}
}
