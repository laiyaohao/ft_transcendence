package com.fttranscendence.learning.question;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

@Entity
@Table(name = "marking_components")
public class MarkingComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    private int position;

    @NotBlank
    @Size(max = 1000)
    @Column(nullable = false, length = 1000)
    private String description;

    @NotNull
    @DecimalMin(value = "0.01")
    @Digits(integer = 4, fraction = 2)
    @Column(nullable = false, precision = 6, scale = 2)
    private BigDecimal marks;

    protected MarkingComponent() {
    }

    public MarkingComponent(String description, BigDecimal marks) {
        this.description = description;
        this.marks = marks;
    }

    @PrePersist
    @PreUpdate
    void normalizeDescription() {
        if (description != null) {
            description = description.trim();
        }
    }

    void attachTo(Question question) {
        this.question = question;
    }

    void detach() {
        this.question = null;
    }

    void setPosition(int position) {
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public int getPosition() {
        return position;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public BigDecimal getMarks() {
        return marks;
    }

    public void setMarks(BigDecimal marks) {
        this.marks = marks;
    }
}
