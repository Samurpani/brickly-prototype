export type NavItem = {
  href: string
  label: string
  short: string
}

export const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", short: "Home" },
  { href: "/projects", label: "Projects", short: "Proj" },
  { href: "/units", label: "Units", short: "Units" },
  { href: "/leads", label: "Leads", short: "Leads" },
  { href: "/contacts", label: "Contacts", short: "People" },
  { href: "/opportunities", label: "Opportunities", short: "Opps" },
  { href: "/pipeline", label: "Pipeline", short: "Flow" },
  { href: "/approvals", label: "Approvals", short: "Auth" },
  { href: "/calendar", label: "Calendar", short: "Cal" },
  { href: "/documents", label: "Documents", short: "Docs" },
  { href: "/payments", label: "Payments", short: "Cash" },
  { href: "/studio", label: "Studio Wizard", short: "Studio" },
  { href: "/settings", label: "Settings", short: "Prefs" },
]
