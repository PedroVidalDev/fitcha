package com.pedro.fitchaadmin.errorlog.services;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;

import com.pedro.fitchaadmin.errorlog.dtos.ErrorLogDTO;
import com.pedro.fitchaadmin.errorlog.entities.ErrorLog;
import com.pedro.fitchaadmin.errorlog.repositories.ErrorLogRepository;

@Service
public class ErrorLogService {
    public static final String FILTER_ALL = "all";
    public static final String FILTER_4XX = "4xx";
    public static final String FILTER_5XX = "5xx";

    private static final int CLIENT_ERROR_MIN = 400;
    private static final int CLIENT_ERROR_MAX = 500;
    private static final int SERVER_ERROR_MIN = 500;

    private final ErrorLogRepository repository;

    public ErrorLogService(ErrorLogRepository repository) {
        this.repository = repository;
    }

    public String normalizeFilter(String type) {
        if (type == null) {
            return FILTER_5XX;
        }

        return switch (type.trim().toLowerCase(Locale.ROOT)) {
            case FILTER_ALL -> FILTER_ALL;
            case FILTER_4XX, "400" -> FILTER_4XX;
            case FILTER_5XX, "500" -> FILTER_5XX;
            default -> FILTER_5XX;
        };
    }

    public List<ErrorLogDTO> getErrorLogs(String type) {
        String filter = normalizeFilter(type);

        List<ErrorLog> logs = switch (filter) {
            case FILTER_4XX -> repository
                    .findByStatusCodeGreaterThanEqualAndStatusCodeLessThanOrderByCreatedAtDesc(
                            CLIENT_ERROR_MIN, CLIENT_ERROR_MAX);
            case FILTER_5XX -> repository
                    .findByStatusCodeGreaterThanEqualOrderByCreatedAtDesc(SERVER_ERROR_MIN);
            default -> repository.findAllByOrderByCreatedAtDesc();
        };

        return logs.stream()
                .map(ErrorLogDTO::new)
                .toList();
    }

    public ErrorLogDTO getErrorLogById(Long id) {
        return new ErrorLogDTO(findErrorLog(id));
    }

    public void markResolved(Long id) {
        ErrorLog errorLog = findErrorLog(id);
        errorLog.markResolved();
        repository.save(errorLog);
    }

    public long countUnresolved() {
        return repository.countByResolvedFalse();
    }

    private ErrorLog findErrorLog(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Error log with ID " + id + " not found!"));
    }
}
