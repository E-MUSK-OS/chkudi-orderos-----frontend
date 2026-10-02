import UniversalPagination, { PaginationProps } from "@/components/ui/Pagination";

export default function Pagination(props: PaginationProps) {
  return <UniversalPagination variant={props.variant || "light"} {...props} />;
}
export * from "@/components/ui/Pagination";
