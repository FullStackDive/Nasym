import LessonDetailClient from "@/components/lesson-detail-client";

export default function Page({params}:{params:{id:string}}){return <LessonDetailClient id={params.id}/>;}
