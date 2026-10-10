"use client";

import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import MultiSelect from "@/components/ui/MultiSelect";
import DatePicker from "@/components/ui/DatePicker";

type Field = {
  id: number;
  key: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
};

export type FieldValueMap = Record<number, string | string[] | undefined>;

type Props = {
  field: Field;
  value: string | string[] | undefined;
  onChange: (value: string | string[]) => void;
};

export default function FieldInput({ field, value, onChange }: Props) {
  if (field.type === "TEXT") {
    return (
      <Textarea
        placeholder={field.label}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "NUMBER") {
    return (
      <Input
        placeholder={field.label}
        type="number"
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "DATE") {
    return (
      <DatePicker
        label={field.label}
        value={(value as string) ?? ""}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (field.type === "SELECT") {
    return (
      <Select
        label={field.label}
        value={(value as string) ?? ""}
        options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
        onChange={(v) => onChange(v)}
      />
    );
  }

  if (field.type === "MULTI_SELECT") {
    return (
      <MultiSelect
        label={field.label}
        value={Array.isArray(value) ? value : []}
        options={field.options ?? []}
        onChange={onChange}
      />
    );
  }

  return (
    <Input
      placeholder={field.label}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
