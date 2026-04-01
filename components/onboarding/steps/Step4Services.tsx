'use client';

import { EditableTable } from '@/components/onboarding/EditableTable';
import type {
  BookableService,
  ProductCategory,
  BookableProduct,
  AdditionalService,
  AdditionalProduct,
  ParametersData,
} from '@/types/onboarding';

interface Step4ServicesProps {
  bookableServices: BookableService[];
  bookableProductCategories: ProductCategory[];
  bookableProducts: BookableProduct[];
  additionalServices: AdditionalService[];
  additionalProductCategories: ProductCategory[];
  additionalProducts: AdditionalProduct[];
  parameters: ParametersData;
  onChange: (update: Partial<{
    bookableServices: BookableService[];
    bookableProductCategories: ProductCategory[];
    bookableProducts: BookableProduct[];
    additionalServices: AdditionalService[];
    additionalProductCategories: ProductCategory[];
    additionalProducts: AdditionalProduct[];
  }>) => void;
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

export function Step4Services({
  bookableServices,
  bookableProductCategories,
  bookableProducts,
  additionalServices,
  additionalProductCategories,
  additionalProducts,
  parameters,
  onChange,
}: Step4ServicesProps) {
  const bookableServiceNames = bookableServices.map((s) => s.name).filter(Boolean);
  const additionalServiceNames = additionalServices.map((s) => s.name).filter(Boolean);
  const bookableCategoryNames = bookableProductCategories.map((c) => c.name).filter(Boolean);
  const additionalCategoryNames = additionalProductCategories.map((c) => c.name).filter(Boolean);

  const productColumns = (categoryNames: string[]) => [
    { key: 'name' as const, label: 'Name', placeholder: 'Product name' },
    { key: 'categoryName' as const, label: 'Category', type: 'select' as const, options: categoryNames, width: '180px' },
    { key: 'productType' as const, label: 'Type', type: 'select' as const, options: parameters.productTypes, width: '140px' },
    { key: 'pricingMode' as const, label: 'Pricing mode', type: 'select' as const, options: parameters.pricingModes, width: '130px' },
    { key: 'consumptionMoment' as const, label: 'Consumption', type: 'select' as const, options: parameters.consumptionMoments, width: '140px' },
    { key: 'pricing' as const, label: 'Price', width: '80px', placeholder: '0' },
  ];

  return (
    <div className="space-y-10">
      <p className="text-sm text-gray-500">
        Review bookable services (what guests can book) and additional services (extras added
        during a stay). Each service can have product categories and products underneath it.
      </p>

      {/* ── Bookable services ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <SectionGroup title="Bookable services" accent="pink">
          <SubSection title="Services" count={bookableServices.length}>
            <EditableTable
              rows={bookableServices}
              columns={[
                { key: 'name', label: 'Name', placeholder: 'e.g. Accommodation' },
                { key: 'productType', label: 'Type', type: 'select', options: parameters.productTypes, width: '140px' },
                { key: 'pricingMode', label: 'Pricing mode', type: 'select', options: parameters.pricingModes, width: '130px' },
                { key: 'description', label: 'Description' },
              ]}
              onChange={(rows) => {
                const updatedCategories = applyRenames(bookableServices, rows, bookableProductCategories, 'serviceName');
                onChange({ bookableServices: rows, bookableProductCategories: updatedCategories });
              }}
              emptyRow={() => ({ name: '', productType: undefined, pricingMode: undefined, description: undefined })}
              addLabel="Add service"
            />
          </SubSection>
          <SubSection title="Product categories" count={bookableProductCategories.length}>
            <EditableTable
              rows={bookableProductCategories}
              columns={[
                { key: 'name', label: 'Category name', placeholder: 'e.g. Breakfast' },
                { key: 'serviceName', label: 'Service', type: 'select', options: bookableServiceNames, width: '200px' },
              ]}
              onChange={(rows) => {
                const updatedProducts = applyRenames(bookableProductCategories, rows, bookableProducts, 'categoryName');
                onChange({ bookableProductCategories: rows, bookableProducts: updatedProducts });
              }}
              emptyRow={() => ({ name: '', serviceName: undefined })}
              addLabel="Add category"
            />
          </SubSection>
          <SubSection title="Products" count={bookableProducts.length}>
            <EditableTable
              rows={bookableProducts}
              columns={productColumns(bookableCategoryNames)}
              onChange={(rows) => onChange({ bookableProducts: rows })}
              emptyRow={() => ({ name: '', categoryName: undefined, productType: undefined, pricingMode: undefined, consumptionMoment: undefined, pricing: undefined })}
              addLabel="Add product"
            />
          </SubSection>
        </SectionGroup>
      </div>

      {/* ── Additional services ───────────────────────────────────────── */}
      <div className="space-y-6">
        <SectionGroup title="Additional services" accent="gray">
          <SubSection title="Services" count={additionalServices.length}>
            <EditableTable
              rows={additionalServices}
              columns={[
                { key: 'name', label: 'Name', placeholder: 'e.g. Bar' },
                { key: 'productType', label: 'Type', type: 'select', options: parameters.productTypes, width: '140px' },
                { key: 'pricingMode', label: 'Pricing mode', type: 'select', options: parameters.pricingModes, width: '130px' },
                { key: 'description', label: 'Description' },
              ]}
              onChange={(rows) => {
                const updatedCategories = applyRenames(additionalServices, rows, additionalProductCategories, 'serviceName');
                const updatedProducts = applyRenames(additionalServices, rows, additionalProducts, 'serviceName');
                onChange({ additionalServices: rows, additionalProductCategories: updatedCategories, additionalProducts: updatedProducts });
              }}
              emptyRow={() => ({ name: '', productType: undefined, pricingMode: undefined, description: undefined })}
              addLabel="Add service"
            />
          </SubSection>
          <SubSection title="Product categories" count={additionalProductCategories.length}>
            <EditableTable
              rows={additionalProductCategories}
              columns={[
                { key: 'name', label: 'Category name', placeholder: 'e.g. Drinks' },
                { key: 'serviceName', label: 'Service', type: 'select', options: additionalServiceNames, width: '200px' },
              ]}
              onChange={(rows) => {
                const updatedProducts = applyRenames(additionalProductCategories, rows, additionalProducts, 'categoryName');
                onChange({ additionalProductCategories: rows, additionalProducts: updatedProducts });
              }}
              emptyRow={() => ({ name: '', serviceName: undefined })}
              addLabel="Add category"
            />
          </SubSection>
          <SubSection title="Products" count={additionalProducts.length}>
            <EditableTable
              rows={additionalProducts}
              columns={[
                { key: 'name', label: 'Name', placeholder: 'Product name' },
                { key: 'serviceName', label: 'Service', type: 'select', options: additionalServiceNames, width: '160px' },
                ...productColumns(additionalCategoryNames).slice(1),
              ]}
              onChange={(rows) => onChange({ additionalProducts: rows })}
              emptyRow={() => ({ name: '', serviceName: undefined, categoryName: undefined, productType: undefined, pricingMode: undefined, consumptionMoment: undefined, pricing: undefined })}
              addLabel="Add product"
            />
          </SubSection>
        </SectionGroup>
      </div>
    </div>
  );
}

function SectionGroup({ title, accent, children }: { title: string; accent: 'pink' | 'gray'; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border ${accent === 'pink' ? 'border-pink-100 bg-pink-50/20' : 'border-gray-200 bg-gray-50/20'} p-5 space-y-5`}>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

function SubSection({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{title}</h3>
        <span className="text-xs bg-white text-gray-400 rounded-full px-2 py-0.5 border border-gray-200">{count}</span>
      </div>
      {children}
    </div>
  );
}
