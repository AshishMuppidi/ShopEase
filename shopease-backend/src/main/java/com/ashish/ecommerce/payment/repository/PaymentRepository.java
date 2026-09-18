package com.ashish.ecommerce.payment.repository;

import com.ashish.ecommerce.payment.entity.Payment;
import com.ashish.ecommerce.payment.entity.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findByIdempotencyKey(String idempotencyKey);
    Optional<Payment> findByTransactionId(String transactionId);
    Optional<Payment> findByOrderId(Long orderId);

    @Modifying
    @Query("update Payment p set p.status = :newStatus where p.id = :id and p.status = :expectedStatus")
    int updateStatusIfCurrent(@Param("id") Long id,
                               @Param("expectedStatus") PaymentStatus expectedStatus,
                               @Param("newStatus") PaymentStatus newStatus);
}
