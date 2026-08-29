package com.pedro.fitchaadmin.errorlog.entities;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Table(name = "tb_error_logs")
@Entity(name = "ErrorLog")
@Getter
@NoArgsConstructor
public class ErrorLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private boolean resolved;

    @Column(nullable = false, columnDefinition = "text")
    private String message;

    @Column(name = "stack_trace", columnDefinition = "text")
    private String stackTrace;

    @Column(nullable = false, length = 10)
    private String method;

    @Column(nullable = false, columnDefinition = "text")
    private String path;

    @Column(name = "status_code", nullable = false)
    private Integer statusCode;

    public void markResolved() {
        this.resolved = true;
    }
}
