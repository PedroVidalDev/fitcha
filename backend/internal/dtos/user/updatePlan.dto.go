package dtos

type UpdatePlanType struct {
	PlanActive *bool `json:"planActive" binding:"required"`
}
