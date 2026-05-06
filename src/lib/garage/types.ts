export type Vehicle = {
  id: string;
  year: string;
  make: string;
  model: string;
};

export type SubModelGroup = "bed_length" | "cab_type" | "trim" | "doors";

export type SubModelAnswer = {
  group: SubModelGroup;
  value: string;
};
