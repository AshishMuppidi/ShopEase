package com.ashish.ecommerce.profile.controller;

import com.ashish.ecommerce.profile.dto.AddressRequest;
import com.ashish.ecommerce.profile.dto.AddressResponse;
import com.ashish.ecommerce.profile.dto.ProfileResponse;
import com.ashish.ecommerce.profile.dto.ProfileUpdateRequest;
import com.ashish.ecommerce.profile.service.ProfileService;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CUSTOMER')")
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new com.ashish.ecommerce.common.exception.ResourceNotFoundException("User not found"));
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(profileService.getProfile(user.getId()));
    }

    @PutMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody ProfileUpdateRequest request,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(profileService.updateProfile(user.getId(), request));
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(profileService.getAddresses(user.getId()));
    }

    @PostMapping("/addresses")
    public ResponseEntity<AddressResponse> addAddress(
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(profileService.addAddress(user.getId(), request));
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<AddressResponse> updateAddress(
            @PathVariable Long id,
            @Valid @RequestBody AddressRequest request,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(profileService.updateAddress(user.getId(), id, request));
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        profileService.deleteAddress(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/addresses/{id}/default")
    public ResponseEntity<AddressResponse> setDefaultAddress(
            @PathVariable Long id,
            Authentication authentication) {
        User user = getCurrentUser(authentication);
        return ResponseEntity.ok(profileService.setDefaultAddress(user.getId(), id));
    }
}
