import Link from "next/link";
export default function NotFound() {
  return (<><h1>Not found</h1><p>No company or season here. <Link href="/">Back to all companies</Link>.</p></>);
}
