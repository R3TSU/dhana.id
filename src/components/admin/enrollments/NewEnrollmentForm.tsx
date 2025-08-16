"use client";

import { useActionState, useState, useMemo } from "react";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface User {
  id: number;
  fullName: string | null;
  email: string | null;
}

interface Course {
  id: number;
  title: string;
}

interface NewEnrollmentFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>;
  users: User[];
  courses: Course[];
}

const initialState = { message: null, errors: {} };

export function NewEnrollmentForm({
  action,
  users,
  courses,
}: NewEnrollmentFormProps) {
  const [state, formAction] = useActionState(action, initialState);

  const [userOpen, setUserOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  const selectedUserLabel = useMemo(() => {
    const u = users.find((x) => x.id === selectedUserId);
    if (!u) return "Choose a user...";
    const base = u.fullName || u.email || `User ${u.id}`;
    return u.email && u.fullName ? `${base} (${u.email})` : base;
  }, [selectedUserId, users]);

  const selectedCourseLabel = useMemo(() => {
    const c = courses.find((x) => x.id === selectedCourseId);
    return c ? c.title : "Choose a course...";
  }, [selectedCourseId, courses]);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label
          htmlFor="userId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select User *
        </label>
        {/* Hidden input to submit the selected value via form action */}
        <input type="hidden" name="userId" value={selectedUserId ?? ""} />
        <Popover open={userOpen} onOpenChange={setUserOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={userOpen}
              className="w-full justify-between"
            >
              {selectedUserLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search users..." />
              <CommandEmpty>No users found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {users.map((u) => {
                    const base = u.fullName || u.email || `User ${u.id}`;
                    const label =
                      u.email && u.fullName ? `${base} (${u.email})` : base;
                    return (
                      <CommandItem
                        key={u.id}
                        value={label}
                        onSelect={() => {
                          setSelectedUserId(u.id);
                          setUserOpen(false);
                        }}
                      >
                        {label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {state.errors?.userId && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.userId.join(", ")}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="courseId"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Select Course *
        </label>
        {/* Hidden input to submit the selected value via form action */}
        <input type="hidden" name="courseId" value={selectedCourseId ?? ""} />
        <Popover open={courseOpen} onOpenChange={setCourseOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={courseOpen}
              className="w-full justify-between"
            >
              {selectedCourseLabel}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
              <CommandInput placeholder="Search courses..." />
              <CommandEmpty>No courses found.</CommandEmpty>
              <CommandList>
                <CommandGroup>
                  {courses.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={c.title}
                      onSelect={() => {
                        setSelectedCourseId(c.id);
                        setCourseOpen(false);
                      }}
                    >
                      {c.title}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {state.errors?.courseId && (
          <p className="mt-1 text-sm text-red-500">
            {state.errors.courseId.join(", ")}
          </p>
        )}
      </div>

      {state.errors?._form && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">
            {state.errors._form.join(", ")}
          </p>
        </div>
      )}

      {state.message &&
        state.message !== "Validation Error" &&
        state.message !== "Error" && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">{state.message}</p>
          </div>
        )}

      <div className="flex justify-end space-x-3">
        <SubmitButton pendingText="Creating...">Create Enrollment</SubmitButton>
      </div>
    </form>
  );
}
