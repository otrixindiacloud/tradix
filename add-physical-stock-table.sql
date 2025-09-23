-- Physical Stock Table for ERP
CREATE TABLE IF NOT EXISTS physical_stock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL,
  location VARCHAR(128),
  quantity INTEGER NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  counted_by VARCHAR(128),
  last_counted TIMESTAMP WITH TIME ZONE,
  notes TEXT
);
