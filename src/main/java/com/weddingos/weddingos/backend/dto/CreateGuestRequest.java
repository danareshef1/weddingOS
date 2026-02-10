package com.weddingos.weddingos.backend.dto;
import jakarta.validation.constraints.NotBlank;

public record CreateGuestRequest(@NotBlank String fullName, @NotBlank String phone, String status) { }