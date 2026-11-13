import { createFileRoute } from "@tanstack/react-router";
import { AeternumClock } from "@/components/aeternum-clock";
import { loadHome } from "@/lib/ceremony.functions";

export const Route = createFileRoute("/")({
  loader: () => loadHome(),
  component: Home,
});

function Home() {
  const initial = Route.useLoaderData();
  return <AeternumClock initial={initial} />;
}
