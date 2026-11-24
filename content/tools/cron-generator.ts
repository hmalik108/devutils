import type { ToolContent } from "../types";

export const content: ToolContent = {
  intro: [
    "Cron schedules recurring jobs on Unix-like systems and in many platforms — Kubernetes CronJobs, GitHub Actions, CI pipelines and cloud schedulers. Its five terse fields are easy to get wrong.",
    "Build an expression with the visual editor or type one directly. The tool validates it, explains it in plain English and previews the next run times.",
  ],
  howTo: [
    "For each field (minute, hour, day of month, month, day of week) choose **Every**, **Every N**, **Specific** values or a **Range**.",
    "The expression updates as you go. Invalid settings (e.g. no values selected, a backwards range) are flagged and no expression is produced.",
    "Or paste an existing expression into the expression box to validate and explain it.",
    "Check the next run times, then copy the expression.",
  ],
  examples: [
    { title: "Weekdays at 9:00", input: "0 9 * * 1-5", output: "At 09:00 on Monday through Friday." },
    { title: "Every 15 minutes during business hours", input: "*/15 9-17 * * *", output: "Every 15 minutes during hour 9 through 17." },
    { title: "First day of every quarter", input: "0 0 1 1,4,7,10 *", output: "At 00:00 on day-of-month 1 in January, April, July and October." },
  ],
  sections: [
    {
      heading: "Supported cron dialect",
      paragraphs: [
        "This tool uses the **standard 5-field cron syntax** of Vixie cron / cronie (most Linux distributions) and POSIX crontab, which is also what Kubernetes CronJobs and GitHub Actions accept.",
      ],
      code: "┌───────────── minute (0–59)\n│ ┌─────────── hour (0–23)\n│ │ ┌───────── day of month (1–31)\n│ │ │ ┌─────── month (1–12 or JAN–DEC)\n│ │ │ │ ┌───── day of week (0–7 or SUN–SAT; 0 and 7 = Sunday)\n│ │ │ │ │\n* * * * *",
      bullets: [
        "Supported: `*`, lists `1,15`, ranges `1-5`, steps `*/10` and `0-30/5`, month/day names, and the macros `@hourly`, `@daily`, `@weekly`, `@monthly`, `@yearly`.",
        "Not supported: a seconds or year field, and Quartz/AWS extensions `?`, `L`, `W`, `#`. These will be reported as errors.",
        "If both day-of-month and day-of-week are restricted, the job runs when **either** matches (`0 0 1 * 1` runs on the 1st **and** every Monday).",
      ],
    },
    {
      heading: "Time zones and daylight saving",
      paragraphs: [
        "Cron runs in the time zone of the machine or scheduler executing it — often UTC on servers and in managed platforms. The preview can show times in your browser's time zone or UTC, but it **cannot guarantee** when a job will actually run in your environment. Around daylight-saving transitions, cron implementations differ in whether skipped or repeated hours run.",
      ],
    },
  ],
  faqs: [
    { q: "Why isn't my AWS or Quartz expression accepted?", a: "AWS EventBridge and Quartz use different dialects (6–7 fields, `?`, `L`, `W`, `#`). This tool validates standard 5-field cron only, to avoid producing expressions that silently behave differently." },
    { q: "Is `*/7` in the minute field every 7 minutes?", a: "Not exactly. It matches minutes 0, 7, 14 … 56 and then restarts at 0 the next hour, so the gap between :56 and :00 is 4 minutes." },
    { q: "Why does the preview show no upcoming runs?", a: "The schedule can never match, such as `0 0 30 2 *` (30 February). The tool warns you rather than generating a schedule that never fires." },
  ],
};
