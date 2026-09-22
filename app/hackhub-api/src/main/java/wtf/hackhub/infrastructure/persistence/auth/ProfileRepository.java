package wtf.hackhub.infrastructure.persistence.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import wtf.hackhub.domain.Profile;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

	Optional<Profile> findByEmail(String email);

	boolean existsByEmail(String email);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT p FROM Profile p WHERE p.id = :id")
	Optional<Profile> findByIdForUpdate(UUID id);
}
