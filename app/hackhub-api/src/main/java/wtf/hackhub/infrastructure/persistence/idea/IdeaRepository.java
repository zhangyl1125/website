package wtf.hackhub.infrastructure.persistence.idea;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wtf.hackhub.domain.Idea;

import java.util.List;
import java.util.UUID;

public interface IdeaRepository extends JpaRepository<Idea, UUID> {
	Page<Idea> findByHackathonIdOrderByCreatedAtDesc(UUID hackathonId, Pageable pageable);
	Page<Idea> findByHackathonIdAndStatusNotOrderByCreatedAtDesc(UUID hackathonId, Idea.Status status,
			Pageable pageable);
	List<Idea> findAllByHackathonId(UUID hackathonId);

	@Query(value = "select i.* from ideas i where exists (select 1 from jsonb_array_elements("
			+ "case when jsonb_typeof(i.project_attachments) = 'array' then i.project_attachments else '[]'::jsonb end) a "
			+ "where a->>'storageKey' = :key)", nativeQuery = true)
	List<Idea> findByAttachmentKey(@Param("key") String key);
}
