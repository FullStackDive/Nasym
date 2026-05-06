import CourseDetailClient from "@/components/course-detail-client";

export const metadata = { title: "Course · Nasym-ur-Rahmah" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CourseDetailClient courseId={id} />;
}
