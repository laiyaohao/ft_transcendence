package com.fttranscendence.learning.worksheet;

import com.fttranscendence.learning.question.Question;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

@Entity
@Table(
    name = "worksheet_questions",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_worksheet_questions_question",
        columnNames = {"worksheet_id", "question_id"}
    )
)
public class WorksheetQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worksheet_id", nullable = false)
    private Worksheet worksheet;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Min(0)
    @Column(nullable = false)
    private int position;

    protected WorksheetQuestion() {
    }

    WorksheetQuestion(Worksheet worksheet, Question question, int position) {
        this.worksheet = worksheet;
        this.question = question;
        this.position = position;
    }

    void attachTo(Worksheet worksheet) {
        this.worksheet = worksheet;
    }

    void detach() {
        worksheet = null;
    }

    void setPosition(int position) {
        this.position = position;
    }

    public Long getId() {
        return id;
    }

    public Question getQuestion() {
        return question;
    }

    public int getPosition() {
        return position;
    }
}
