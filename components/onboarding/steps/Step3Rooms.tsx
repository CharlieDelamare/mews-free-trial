'use client';

import { EditableTable } from '@/components/onboarding/EditableTable';
import type { ResourceCategory, Resource, ResourceFeature, ParametersData } from '@/types/onboarding';

interface Step3RoomsProps {
  categories: ResourceCategory[];
  resources: Resource[];
  features: ResourceFeature[];
  parameters: ParametersData;
  onChange: (update: { categories?: ResourceCategory[]; resources?: Resource[]; features?: ResourceFeature[] }) => void;
}

function applyRenames<T extends object>(
  oldRows: { name?: string }[],
  newRows: { name?: string }[],
  dependents: T[],
  fk: keyof T,
): T[] {
  let result = dependents;
  for (let i = 0; i < Math.min(oldRows.length, newRows.length); i++) {
    const o = oldRows[i].name;
    const n = newRows[i].name;
    if (o && n && o !== n) result = result.map((d) => (d[fk] === o ? { ...d, [fk]: n } : d));
  }
  return result;
}

export function Step3Rooms({ categories, resources, features, parameters, onChange }: Step3RoomsProps) {
  const categoryNames = categories.map((c) => c.name).filter(Boolean);

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-500">
        Review and edit your room categories, individual units, and room features. These map to the
        ResourceCategories, Resources, and ResourceFeatures sheets.
      </p>

      <section className="space-y-3">
        <SectionHeader
          title="Room categories"
          count={categories.length}
          hint="Defines the types of rooms (e.g. Standard Double, Suite). Each room belongs to a category."
        />
        <EditableTable
          rows={categories}
          columns={[
            { key: 'name', label: 'Name', placeholder: 'e.g. Standard Double' },
            {
              key: 'spaceType',
              label: 'Space type',
              type: 'select',
              options: parameters.spaceTypes,
              width: '150px',
            },
            {
              key: 'classification',
              label: 'Classification',
              type: 'select',
              options: parameters.classifications,
              width: '150px',
            },
            { key: 'capacity', label: 'Capacity', type: 'number', width: '80px' },
            { key: 'description', label: 'Description', placeholder: 'Optional' },
          ]}
          onChange={(rows) => {
            const updatedResources = applyRenames(categories, rows, resources, 'categoryName');
            onChange({ categories: rows, resources: updatedResources });
          }}
          emptyRow={() => ({ name: '', spaceType: undefined, classification: undefined, capacity: undefined, description: undefined })}
          addLabel="Add category"
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Individual rooms"
          count={resources.length}
          hint="Each room unit — with its name, category assignment, and floor."
        />
        <EditableTable
          rows={resources}
          columns={[
            { key: 'name', label: 'Room name', placeholder: 'e.g. 101' },
            {
              key: 'categoryName',
              label: 'Category',
              type: 'select',
              options: categoryNames,
              width: '200px',
            },
            { key: 'floor', label: 'Floor', width: '80px', placeholder: '1' },
            { key: 'description', label: 'Description', placeholder: 'Optional' },
          ]}
          onChange={(rows) => onChange({ resources: rows })}
          emptyRow={() => ({ name: '', categoryName: undefined, floor: undefined, description: undefined })}
          addLabel="Add room"
        />
      </section>

      <section className="space-y-3">
        <SectionHeader
          title="Room features"
          count={features.length}
          hint="Amenities that can be assigned to rooms (e.g. Sea View, Balcony)."
        />
        <EditableTable
          rows={features}
          columns={[
            { key: 'name', label: 'Feature name', placeholder: 'e.g. Sea View' },
            {
              key: 'classification',
              label: 'Classification',
              type: 'select',
              options: parameters.classifications,
              width: '200px',
            },
          ]}
          onChange={(rows) => onChange({ features: rows })}
          emptyRow={() => ({ name: '', classification: undefined })}
          addLabel="Add feature"
        />
      </section>
    </div>
  );
}

function SectionHeader({ title, count, hint }: { title: string; count: number; hint: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
        <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5 font-medium">
          {count}
        </span>
      </div>
      <p className="text-xs text-gray-400">{hint}</p>
    </div>
  );
}
