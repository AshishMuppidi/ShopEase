package com.ashish.ecommerce.profile.service;

import com.ashish.ecommerce.common.exception.ResourceNotFoundException;
import com.ashish.ecommerce.profile.dto.AddressRequest;
import com.ashish.ecommerce.profile.dto.AddressResponse;
import com.ashish.ecommerce.profile.dto.ProfileResponse;
import com.ashish.ecommerce.profile.dto.ProfileUpdateRequest;
import com.ashish.ecommerce.profile.entity.UserAddress;
import com.ashish.ecommerce.profile.repository.UserAddressRepository;
import com.ashish.ecommerce.user.entity.User;
import com.ashish.ecommerce.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapProfile(user);
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setName(req.getName());
        user.setPhone(req.getPhone());
        user = userRepository.save(user);
        return mapProfile(user);
    }

    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(Long userId) {
        return addressRepository.findByUserId(userId).stream()
                .map(this::mapAddress)
                .collect(Collectors.toList());
    }

    @Transactional
    public AddressResponse addAddress(Long userId, AddressRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (req.isDefault()) {
            addressRepository.clearDefaultForUser(userId);
        }

        UserAddress address = UserAddress.builder()
                .user(user)
                .label(req.getLabel())
                .street(req.getStreet())
                .city(req.getCity())
                .state(req.getState())
                .pinCode(req.getPinCode())
                .phone(req.getPhone())
                .isDefault(req.isDefault())
                .build();

        return mapAddress(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest req) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (req.isDefault() && !address.isDefault()) {
            addressRepository.clearDefaultForUser(userId);
        }

        address.setLabel(req.getLabel());
        address.setStreet(req.getStreet());
        address.setCity(req.getCity());
        address.setState(req.getState());
        address.setPinCode(req.getPinCode());
        address.setPhone(req.getPhone());
        address.setDefault(req.isDefault());

        return mapAddress(addressRepository.save(address));
    }

    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));
        addressRepository.delete(address);
    }

    @Transactional
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        UserAddress address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (!address.isDefault()) {
            addressRepository.clearDefaultForUser(userId);
            address.setDefault(true);
            address = addressRepository.save(address);
        }
        return mapAddress(address);
    }

    private ProfileResponse mapProfile(User user) {
        return ProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .build();
    }

    private AddressResponse mapAddress(UserAddress addr) {
        return AddressResponse.builder()
                .id(addr.getId())
                .label(addr.getLabel())
                .street(addr.getStreet())
                .city(addr.getCity())
                .state(addr.getState())
                .pinCode(addr.getPinCode())
                .phone(addr.getPhone())
                .isDefault(addr.isDefault())
                .build();
    }
}
