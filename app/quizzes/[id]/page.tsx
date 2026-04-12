import QuizTakeClient from "@/components/quiz-take-client";

export default function Page({params}:{params:{id:string}}){return <QuizTakeClient id={params.id}/>;}
