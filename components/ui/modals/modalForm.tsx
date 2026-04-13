import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRef } from "react";

export function ModalForm({
  buttonText = "Open Dialog",
  title = "Edit profile",
  description = "Make changes to your profile here. Click save when you&apos;re done.",
  formFields = [],
}: {
  buttonText?: string;
  title?: string;
  description?: string;
  formFields?: {
    label: string;
    id: string;
    type: string;
    placeholder: string;
    options?: string[];
    initialValue?: string;
  }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);

  console.log(
    formFields.map((field) =>
      field.type === "select" ? field.initialValue : null
    )
  );
  //   console.log(buttonText);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">{buttonText}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 mb-4">
            {formFields.map((field) => (
              <div key={field.id} className="grid gap-3">
                <Label htmlFor={field.id}>{field.label}</Label>
                {field.type === "select" ? (
                  <select
                    id={field.id}
                    name={field.id}
                    defaultValue={field.initialValue || ""}
                  >
                    <option value="" disabled>
                      {field.placeholder}
                    </option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    id={field.id}
                    name={field.id}
                    type={field.type}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              onClick={(e) => {
                e.preventDefault();
                // Handle form submission logic here
                // console the values of the form fields
                if (formRef.current) {
                  const formData = new FormData(formRef.current);
                  formFields.forEach((field) => {
                    console.log(`${field.label}: ${formData.get(field.id)}`);
                  });
                } else {
                  console.log("Form not found");
                }
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
