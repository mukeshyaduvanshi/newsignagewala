import { LoaderIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"

function Loader({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderIcon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export function SimpleLoader() {
  return (
    <div className="flex items-center gap-4">
      <Loader />
    </div>
  )
}


export function LoaderWithText({text, position = "left"}: { text?: string, position?: "left" | "right" }) {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="flex max-w-xs flex-col gap-4 [--radius:1rem]">
        <Item className="flex items-center justify-center">
          {position === "left" && (
            <ItemMedia>
              <Loader />
            </ItemMedia>
          )}
          <ItemContent>
            <ItemTitle className="line-clamp-1">{text}</ItemTitle>
          </ItemContent>
          {position === "right" && (
            <ItemMedia>
              <Loader />
            </ItemMedia>
          )}
        </Item>
      </div>
    </div>
  )
}