package com.pedro.fitchaadmin.errorlog.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pedro.fitchaadmin.errorlog.entities.ErrorLog;

public interface ErrorLogRepository extends JpaRepository<ErrorLog, Long> {
    List<ErrorLog> findAllByOrderByCreatedAtDesc();

    List<ErrorLog> findByStatusCodeGreaterThanEqualOrderByCreatedAtDesc(int minStatus);

    List<ErrorLog> findByStatusCodeGreaterThanEqualAndStatusCodeLessThanOrderByCreatedAtDesc(int minStatus, int maxStatus);

    long countByResolvedFalse();
}
