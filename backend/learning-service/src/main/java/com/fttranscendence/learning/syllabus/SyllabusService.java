package com.fttranscendence.learning.syllabus;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Read-only curriculum queries shared by Tutor and Student workflows. */
@Service
public class SyllabusService {

    private final SyllabusTopicRepository topics;

    public SyllabusService(SyllabusTopicRepository topics) {
        this.topics = topics;
    }

    @Transactional(readOnly = true)
    public SyllabusTreeResponse tree() {
        List<SyllabusTopic> activeTopics = topics.findAllByActiveTrueOrderByDepthAscSortOrderAscCodeAsc();
        Map<Long, List<SyllabusTopic>> childrenByParent = new HashMap<>();
        List<SyllabusTopic> roots = new ArrayList<>();
        for (SyllabusTopic topic : activeTopics) {
            if (topic.getParentId() == null) roots.add(topic);
            else childrenByParent.computeIfAbsent(topic.getParentId(), ignored -> new ArrayList<>()).add(topic);
        }
        return new SyllabusTreeResponse(roots.stream().map(topic -> node(topic, childrenByParent)).toList());
    }

    @Transactional(readOnly = true)
    public SyllabusNodeList children(Long parentId, SyllabusTopic.NodeType nodeType) {
        if (parentId != null) {
            SyllabusTopic parent = topics.findById(parentId)
                .filter(SyllabusTopic::isActive)
                .orElseThrow(SyllabusNotFoundException::new);
            if (nodeType != null && nodeType.getDepth() != parent.getDepth() + 1) {
                return new SyllabusNodeList(List.of());
            }
            return new SyllabusNodeList(topics.findAllByParentIdAndActiveTrueOrderBySortOrderAscCodeAsc(parentId)
                .stream().filter(topic -> nodeType == null || topic.getNodeType() == nodeType)
                .map(topic -> node(topic, Map.of())).toList());
        }
        SyllabusTopic.NodeType expected = nodeType == null ? SyllabusTopic.NodeType.SUBJECT : nodeType;
        if (expected != SyllabusTopic.NodeType.SUBJECT) return new SyllabusNodeList(List.of());
        return new SyllabusNodeList(topics.findAllByNodeTypeAndActiveTrueOrderBySortOrderAscCodeAsc(expected)
            .stream().map(topic -> node(topic, Map.of())).toList());
    }

    private SyllabusNode node(SyllabusTopic topic, Map<Long, List<SyllabusTopic>> childrenByParent) {
        List<SyllabusTopic> children = childrenByParent.getOrDefault(topic.getId(), List.of());
        children = children.stream().sorted(Comparator.comparingInt(SyllabusTopic::getSortOrder)
            .thenComparing(SyllabusTopic::getCode)).toList();
        return new SyllabusNode(topic.getId(), topic.getCode(), topic.getName(), topic.getNodeType(),
            topic.getParentId(), children.stream().map(child -> node(child, childrenByParent)).toList());
    }

    public record SyllabusTreeResponse(List<SyllabusNode> items) {}
    public record SyllabusNodeList(List<SyllabusNode> items) {}
    public record SyllabusNode(
        long id,
        String code,
        String name,
        SyllabusTopic.NodeType nodeType,
        Long parentId,
        List<SyllabusNode> children
    ) {}

    public static final class SyllabusNotFoundException extends RuntimeException {}
}
