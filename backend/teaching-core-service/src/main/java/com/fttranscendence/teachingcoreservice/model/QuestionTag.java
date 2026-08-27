package com.fttranscendence.teachingcoreservice.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "question_tags")
@Data
@NoArgsConstructor
public class QuestionTag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "tag_name", nullable = false)
    private String tagName;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag_type", nullable = false)
    private TagType tagType;
}