import { DOTS, usePagination } from "@/hooks/use-pagination";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";
import { cn } from "@/lib/utils";
import type { ContainerVariant } from "./container";
import { getButtonVariantFromContainerVariant } from "./button";

interface Props {
  onPageChange: (page: number) => void;
  totalCount: number; // element count
  siblingCount?: number; // pagination button sibling count
  currentPage: number;
  pageSize: number;
  hideIfLessThanTwoPages?: boolean;
  variant: ContainerVariant;
}

const CustomPagination: React.FC<Props> = ({
  onPageChange,
  totalCount,
  siblingCount = 1,
  currentPage,
  pageSize,
  hideIfLessThanTwoPages = false,
  variant,
}) => {
  const paginationRange = usePagination({
    currentPage,
    totalCount,
    siblingCount,
    pageSize,
  });

  const maxPage = pageSize > 0 ? Math.ceil(totalCount / pageSize) : 0;

  if (
    (currentPage === 0 || (paginationRange && paginationRange?.length < 2)) &&
    hideIfLessThanTwoPages
  ) {
    return null;
  }

  const onNext = () => {
    if (currentPage >= maxPage) return;
    onPageChange(currentPage + 1);
  };

  const onPrevious = () => {
    if (currentPage <= 1) return;
    onPageChange(currentPage - 1);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem onClick={onPrevious}>
          <PaginationPrevious
            className={cn("cursor-pointer", {
              "cursor-not-allowed": currentPage <= 1,
            })}
            variant={getButtonVariantFromContainerVariant({
              containerVariant: variant,
              isActive: true,
            })}
          />
        </PaginationItem>
        {paginationRange?.map((page, index) => {
          if (page === DOTS) {
            return (
              <PaginationItem key={`dots-${index}`}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }
          return (
            <PaginationItem
              key={page}
              onClick={() => onPageChange(Number(page))}
            >
              <PaginationLink
                isActive={page === currentPage}
                className="cursor-pointer data-[active=true]:bg-primary data-[active=true]:text-white"
                variant={getButtonVariantFromContainerVariant({
                  containerVariant: variant,
                  isActive: false,
                })}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}
        <PaginationItem onClick={onNext}>
          <PaginationNext
            className={cn("cursor-pointer", {
              "cursor-not-allowed": currentPage >= maxPage,
            })}
            variant={getButtonVariantFromContainerVariant({
              containerVariant: variant,
              isActive: true,
            })}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default CustomPagination;
