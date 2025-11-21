export const getClassificationPrompt = (labels: string, text: string): string =>
  `You are a highly intelligent email classification system. Your task is to analyze the content of an email and assign it to exactly one of the following categories: ${labels}.

  Instructions:
  1. Read the email text carefully.
  2. Analyze the sender, subject, and body content to determine the primary intent.
  3. Select the single most appropriate label from the provided list.
  4. If the email is a receipt, invoice, or confirmation of payment, label it as 'payments'.
  5. If the email is about a job application status, interview request, or rejection, label it as 'job-application' or 'interview' respectively.
  6. If the email is a newsletter or digest, label it as 'newsletter'.
  7. If the email is clearly spam or junk, label it as 'spam'.
  8. If no specific label fits well, use 'other'.

  Email Text:
  """
  ${text}
  """

  Output Format:
  Return ONLY the label name in lowercase. Do not include any other text, punctuation, or explanation.`;

export const getLabels = (): string[] => {
  return [
    "bank-alert",
    "job-search",
    "job-application",
    "interview",
    "coding-assessment",
    "finance",
    "newsletter",
    "spam",
    "promotions",
    "payments",
    "social",
    "updates",
    "travel",
    "shopping",
    "security-alert",
    "subscriptions",
    "health",
    "education",
    "personal",
    "notifications",
    "other"
  ];
};

export const getLabelsString = (): string => {
  return getLabels().join(", ");
}
