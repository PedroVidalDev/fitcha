package queue

import (
	"os"
	"strconv"
	"strings"

	"github.com/hibiken/asynq"
)

func RedisClientOptFromEnv() asynq.RedisClientOpt {
	db := 0
	if raw := strings.TrimSpace(os.Getenv("REDIS_DB")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed >= 0 {
			db = parsed
		}
	}

	addr := strings.TrimSpace(os.Getenv("REDIS_ADDR"))
	if addr == "" {
		addr = "localhost:6379"
	}

	return asynq.RedisClientOpt{
		Addr:     addr,
		Password: strings.TrimSpace(os.Getenv("REDIS_PASSWORD")),
		DB:       db,
	}
}

func NewClientFromEnv() *asynq.Client {
	return asynq.NewClient(RedisClientOptFromEnv())
}

func NewServerFromEnv() *asynq.Server {
	concurrency := 10
	if raw := strings.TrimSpace(os.Getenv("ASYNQ_CONCURRENCY")); raw != "" {
		if parsed, err := strconv.Atoi(raw); err == nil && parsed > 0 {
			concurrency = parsed
		}
	}

	return asynq.NewServer(
		RedisClientOptFromEnv(),
		asynq.Config{
			Concurrency: concurrency,
			Queues: map[string]int{
				"emails": 1,
			},
		},
	)
}
