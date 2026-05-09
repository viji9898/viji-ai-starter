import type { ProbeDefinition } from "../types/app";

export const domainProbes: ProbeDefinition[] = [
  {
    id: "domain-users-readonly",
    title: "Domain Users Readonly",
    endpoint: "domain-users-readonly",
    description:
      "Lists workspace directory members with a narrow readonly field set for admin review.",
  },
  {
    id: "domain-task",
    title: "Domain Task Totals",
    endpoint: "domain-task",
    description:
      "Runs the delegated mailbox task check for the configured allowlisted mailboxes and returns task-list and total-task counts per mailbox.",
  },
  {
    id: "domain-meet",
    title: "Domain Meet Events",
    endpoint: "domain-meet",
    description:
      "Lists this month's Google Meet-backed calendar events for the configured allowlisted mailboxes.",
  },
];