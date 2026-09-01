/**
 * Synthetic data for the services portal ("City of Meridian — Resident
 * Services"). Deliberately different in structure from the shop: multiple
 * nav areas, a multi-step form, deadlines, request status table,
 * appointments. All fictional.
 */

export interface ServiceTask {
  id: string;
  title: string;
  summary: string;
  plain_summary: string;
  steps: string[];
  fee: number | null;
  deadline_note: string;
  office: string;
}

export const SERVICE_TASKS: ServiceTask[] = [
  {
    id: "parking-permit",
    title: "Resident parking permit",
    summary:
      "Apply for the annual resident parking permit for zone B. Processing takes up to 10 working days after complete submission.",
    plain_summary:
      "You can ask the city for a parking permit for your street. It takes about 10 working days to process.",
    steps: [
      "Check you live in zone B",
      "Enter your resident details",
      "Enter your vehicle details",
      "Review and submit the application",
    ],
    fee: 32.5,
    deadline_note: "No fixed deadline; permits start on the first of the following month.",
    office: "Office for Mobility",
  },
  {
    id: "waste-calendar",
    title: "Waste collection calendar",
    summary:
      "Subscribe to the collection calendar for your street and receive reminders two days before pickup.",
    plain_summary: "You can get the rubbish collection dates for your street and reminders before pickup.",
    steps: ["Choose your street", "Choose collection types", "Enter reminder address", "Confirm subscription"],
    fee: 0,
    deadline_note: "Subscription is possible all year.",
    office: "Municipal Operations",
  },
  {
    id: "library-card",
    title: "Library card renewal",
    summary:
      "Renew the annual library card. Digital cards are issued immediately; plastic cards by post within a week.",
    plain_summary: "You can renew your library card for one year. A digital card works right away.",
    steps: ["Enter card number", "Check personal details", "Pay the annual fee", "Receive the new card"],
    fee: 18.0,
    deadline_note: "Renew before the expiry date printed on the card.",
    office: "City Library",
  },
];

export interface RequestStatus {
  id: string;
  task: string;
  status: "received" | "in_review" | "action_needed" | "approved" | "rejected";
  status_label: string;
  submitted: string;
  last_update: string;
  next_step: string;
}

export const REQUESTS: RequestStatus[] = [
  {
    id: "REQ-20431",
    task: "Resident parking permit",
    status: "in_review",
    status_label: "In review",
    submitted: "2026-08-19",
    last_update: "2026-08-27",
    next_step: "The office checks your address document. No action needed.",
  },
  {
    id: "REQ-20388",
    task: "Library card renewal",
    status: "action_needed",
    status_label: "Action needed",
    submitted: "2026-08-05",
    last_update: "2026-08-25",
    next_step: "The annual fee of €18.00 has not been paid yet. Please pay online or at the desk.",
  },
  {
    id: "REQ-20117",
    task: "Waste collection calendar",
    status: "approved",
    status_label: "Approved",
    submitted: "2026-07-02",
    last_update: "2026-07-04",
    next_step: "Your subscription is active. Reminders go to your email.",
  },
];

export interface Appointment {
  id: string;
  office: string;
  topic: string;
  date: string;
  time: string;
  location: string;
  slots: number;
}

export const APPOINTMENTS: Appointment[] = [
  {
    id: "APT-8812",
    office: "Office for Mobility",
    topic: "Permit handover (in person)",
    date: "2026-09-09",
    time: "10:20",
    location: "Meridian Hall, Room 2.14",
    slots: 3,
  },
  {
    id: "APT-8830",
    office: "City Library",
    topic: "Card desk — fast lane",
    date: "2026-09-11",
    time: "14:00",
    location: "City Library, Ground floor",
    slots: 6,
  },
  {
    id: "APT-8847",
    office: "Citizen Centre",
    topic: "Document check",
    date: "2026-09-15",
    time: "09:40",
    location: "Citizen Centre, Counter 4",
    slots: 2,
  },
];

/** Multi-step form definition used by /services and focus_task. */
export const PERMIT_FORM_STEPS = [
  {
    id: "resident",
    title: "Resident details",
    fields: [
      { id: "full_name", label: "Full name", type: "text", required: true, hint: "As on your registration certificate." },
      { id: "address", label: "Street and number", type: "text", required: true, hint: "Zone B address." },
      { id: "move_in", label: "Moved in since", type: "date", required: true, hint: "Found on the registration certificate." },
    ],
  },
  {
    id: "vehicle",
    title: "Vehicle details",
    fields: [
      { id: "plate", label: "Number plate", type: "text", required: true, hint: "e.g. M-AB 1234." },
      { id: "kind", label: "Vehicle type", type: "select", options: ["Car", "Motorcycle", "Electric car"], required: true },
    ],
  },
  {
    id: "review",
    title: "Review and submit",
    fields: [
      { id: "confirm_accuracy", label: "All details are correct", type: "checkbox", required: true, hint: "You review everything before submitting." },
    ],
  },
] as const;

export interface HelpTopic {
  id: string;
  question: string;
  answer: string;
  plain_answer: string;
}

export const HELP_TOPICS: HelpTopic[] = [
  {
    id: "processing-time",
    question: "How long does processing take?",
    answer:
      "Applications are processed in arrival order. The standard processing time is up to 10 working days after a complete submission. You can check the current status any time in “My requests”.",
    plain_answer:
      "The office needs up to 10 working days. You can always look at the status in “My requests”.",
  },
  {
    id: "documents",
    question: "Which documents do I need?",
    answer:
      "A valid registration certificate and, for parking permits, the vehicle registration document. Photos of documents are sufficient for the online application.",
    plain_answer:
      "You need your registration paper. For a parking permit you also need the vehicle paper. Photos are okay.",
  },
  {
    id: "deadlines",
    question: "Are there deadlines?",
    answer:
      "Most services have no deadline. Library cards should be renewed before the printed expiry date. Payments noted as “action needed” should be completed within 30 days.",
    plain_answer:
      "Most things have no deadline. Renew your library card on time. Pay open fees within 30 days.",
  },
];

export const SERVICE_ANNOUNCEMENTS = [
  { id: "an-1", text: "Citizen Centre counter 4 is closed on 2026-09-12.", tone: "info" as const },
  { id: "an-2", text: "New: waste calendar reminders now also via SMS.", tone: "info" as const },
];
