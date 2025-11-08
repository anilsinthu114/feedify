import { GetServerSideProps } from "next";

export default function FeedbackView({ feedback }: any) {
  if (!feedback) return <div>Invalid or expired link</div>;

  const style = {
    marginBottom: '10px',
    };

  return (
    <div >
      <h2>Feedback for {feedback.userName}</h2>
      <p><strong>Session:</strong> {new Date(feedback.sessionAt).toLocaleString()}</p>
      <p><strong>Observations:</strong> {feedback.observations}</p>
      <p><strong>Recommendations:</strong> {feedback.recommendations}</p>
      <p><strong>Rating:</strong> {feedback.rating}</p>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const token = ctx.query.token as string | undefined;
  if (!token) return { props: { feedback: null } };

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/view?token=${token}`);
  if (!res.ok) return { props: { feedback: null } };

  const data = await res.json();
  return { props: { feedback: data.feedback } };
};
