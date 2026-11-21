import { supabaseAdmin } from "@/lib/supabase/admin";

export interface FieldJobItem {
  id: string;
  job_no: string;
  type: string;
  status: string;
  title: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  site_address: string;
  project: {
    id: string;
    project_no: string;
    requested_kw: number;
    system_type: string;
    customer: {
      id: string;
      name: string;
      phone_e164: string;
    };
  };
  technician_name: string;
}

const MOCK_BASE_TIME = 1763720000000;

export async function getTechnicianJobs(): Promise<FieldJobItem[]> {
  const db = supabaseAdmin();

  const { data: jobs } = await db
    .from("jobs")
    .select(`
      id, job_no, type, status, title, scheduled_start, scheduled_end, site_address,
      project:projects(
        id, project_no, requested_kw, system_type,
        customer:customers(id, name, phone_e164)
      ),
      crew:job_crew(
        profile:profiles(full_name)
      )
    `)
    .in("type", ["install", "survey", "service"])
    .order("scheduled_start", { ascending: true });

  if (!jobs || jobs.length === 0) {
    return [
      {
        id: "j1111111-0000-0000-0000-000000000003",
        job_no: "JOB-2627-00003",
        type: "install",
        status: "scheduled",
        title: "Rooftop Solar Installation (3 kW) for Anita Sharma",
        scheduled_start: new Date(MOCK_BASE_TIME + 1000 * 60 * 60 * 2).toISOString(),
        scheduled_end: new Date(MOCK_BASE_TIME + 1000 * 60 * 60 * 8).toISOString(),
        site_address: "Plot 14, Lotus Park, Baner, Pune",
        project: {
          id: "p1111111-0000-0000-0000-000000000001",
          project_no: "PRJ-2627-00001",
          requested_kw: 3.0,
          system_type: "on_grid",
          customer: {
            id: "c1",
            name: "Anita Sharma",
            phone_e164: "+919876543210",
          },
        },
        technician_name: "Imran Khan",
      },
    ];
  }

  return (jobs as any[]).map((j) => ({
    id: j.id,
    job_no: j.job_no,
    type: j.type,
    status: j.status,
    title: j.title,
    scheduled_start: j.scheduled_start,
    scheduled_end: j.scheduled_end,
    site_address: j.site_address || "Pune Site",
    project: j.project,
    technician_name: j.crew?.[0]?.profile?.full_name || "Lead Field Technician",
  }));
}

export async function getInstallJobById(id: string): Promise<FieldJobItem | null> {
  const list = await getTechnicianJobs();
  return list.find((j) => j.id === id) || list[0];
}
