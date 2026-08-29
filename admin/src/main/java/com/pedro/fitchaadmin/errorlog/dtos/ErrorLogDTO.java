package com.pedro.fitchaadmin.errorlog.dtos;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

import com.pedro.fitchaadmin.errorlog.entities.ErrorLog;

public record ErrorLogDTO(
        Long id,
        Instant createdAt,
        boolean resolved,
        String message,
        String stackTrace,
        String method,
        String path,
        Integer statusCode
) {
    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss").withZone(ZoneId.systemDefault());

    public ErrorLogDTO(ErrorLog errorLog) {
        this(
                errorLog.getId(),
                errorLog.getCreatedAt(),
                errorLog.isResolved(),
                errorLog.getMessage(),
                errorLog.getStackTrace(),
                errorLog.getMethod(),
                errorLog.getPath(),
                errorLog.getStatusCode()
        );
    }

    public String createdAtText() {
        return createdAt == null ? "—" : FORMATTER.format(createdAt);
    }

    public String truncatedMessage() {
        String normalized = message == null ? "" : message;
        return normalized.length() > 140 ? normalized.substring(0, 140) + "…" : normalized;
    }

    public boolean isServerError() {
        return statusCode != null && statusCode >= 500;
    }

    public boolean hasStackTrace() {
        return stackTrace != null && !stackTrace.isBlank();
    }
}
