<?php

declare(strict_types=1);

namespace App\Controller\Assessment;

use App\Domain\AssessmentAnswer;
use App\Domain\AssessmentRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AssessmentAnswerController extends AbstractController
{
    private AssessmentRepository $assessmentRepository;

    public function __construct(AssessmentRepository $assessmentRepository)
    {
        $this->assessmentRepository = $assessmentRepository;
    }

    /**
     * @Route("/api/assessment/answers", methods={"POST"})
     */
    public function __invoke(Request $request): JsonResponse
    {
        // Parse JSON body
        $data = json_decode($request->getContent(), true);

        if (!is_array($data)) {
            return $this->json([
                'error' => 'Invalid JSON body',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validate required fields
        $instanceId = $data['instance_id'] ?? null;
        $questionId = $data['question_id'] ?? null;
        $answerOptionId = $data['answer_option_id'] ?? null;
        $textAnswer = $data['text_answer'] ?? null;

        if (!$instanceId) {
            return $this->json([
                'error' => 'instance_id is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (!$questionId) {
            return $this->json([
                'error' => 'question_id is required',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Find instance
        try {
            $instance = $this->assessmentRepository->findAssessmentInstanceById($instanceId);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Invalid instance_id format',
            ], Response::HTTP_BAD_REQUEST);
        }
        if (!$instance) {
            return $this->json([
                'error' => 'Assessment instance not found',
            ], Response::HTTP_NOT_FOUND);
        }

        // Find question
        try {
            $question = $this->assessmentRepository->findAssessmentQuestionById($questionId);
        } catch (\Exception $e) {
            return $this->json([
                'error' => 'Invalid question_id format',
            ], Response::HTTP_BAD_REQUEST);
        }
        if (!$question) {
            return $this->json([
                'error' => 'Question not found',
            ], Response::HTTP_NOT_FOUND);
        }

        // Verify question belongs to the assessment linked to this instance
        $assessment = $instance->getSession()->getAssessment();
        if (!$assessment) {
            return $this->json([
                'error' => 'Assessment not found for this instance',
            ], Response::HTTP_NOT_FOUND);
        }

        $assessmentQuestions = $assessment->getQuestions();
        $questionBelongs = false;
        foreach ($assessmentQuestions as $q) {
            if ($q->getId() === $question->getId()) {
                $questionBelongs = true;
                break;
            }
        }

        if (!$questionBelongs) {
            return $this->json([
                'error' => 'Question does not belong to this assessment',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Handle based on question type
        $answerOption = null;

        if ($question->getIsReflection()) {
            // Reflection question: requires text_answer
            if (!$textAnswer || trim($textAnswer) === '') {
                return $this->json([
                    'error' => 'text_answer is required for reflection questions',
                ], Response::HTTP_BAD_REQUEST);
            }
        } else {
            // Likert question: requires answer_option_id
            if (!$answerOptionId) {
                return $this->json([
                    'error' => 'answer_option_id is required for Likert questions',
                ], Response::HTTP_BAD_REQUEST);
            }

            try {
                $answerOption = $this->assessmentRepository->findAssessmentAnswerOptionById($answerOptionId);
            } catch (\Exception $e) {
                return $this->json([
                    'error' => 'Invalid answer_option_id format',
                ], Response::HTTP_BAD_REQUEST);
            }
            if (!$answerOption) {
                return $this->json([
                    'error' => 'Answer option not found',
                ], Response::HTTP_NOT_FOUND);
            }

            // Verify option belongs to the question
            if ($answerOption->getAssessmentQuestion()->getId() !== $question->getId()) {
                return $this->json([
                    'error' => 'Answer option does not belong to this question',
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        // Create and persist the answer
        $answer = new AssessmentAnswer(
            null,
            $instance,
            $answerOption,
            $textAnswer,
            $answerOption ? $answerOption->getValue() : null
        );

        $this->assessmentRepository->saveAnswer($answer);

        return $this->json([
            'id' => $answer->getId(),
            'instance_id' => $instance->getId(),
            'question_id' => $question->getId(),
            'answer_option_id' => $answerOption?->getId(),
            'text_answer' => $textAnswer,
            'message' => 'Answer submitted successfully',
        ], Response::HTTP_CREATED);
    }
}