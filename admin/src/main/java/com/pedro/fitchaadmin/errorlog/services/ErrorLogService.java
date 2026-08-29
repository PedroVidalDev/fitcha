package com.pedro.fitchaadmin.errorlog.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.pedro.fitchaadmin.errorlog.dtos.ErrorLogDTO;
import com.pedro.fitchaadmin.errorlog.entities.ErrorLog;
import com.pedro.fitchaadmin.errorlog.repositories.ErrorLogRepository;

@Service
public class ErrorLogService {
    private final ErrorLogRepository repository;

    public ErrorLogService(ErrorLogRepository repository) {
        this.repository = repository;
    }

    public List<ErrorLogDTO> getErrorLogs() {
        return repository.findAllByOrderByCreatedAtDesc().stream()
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
