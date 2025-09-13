import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Calculator, Download, Edit, Trash2, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema definitions
const createProductCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentCategoryId: z.string().optional(),
  retailMarkupPercentage: z.string().optional(),
  wholesaleMarkupPercentage: z.string().optional(),
});

const createMarkupConfigSchema = z.object({
  level: z.enum(["System", "Category", "Item"]),
  entityId: z.string().optional(),
  retailMarkupPercentage: z.string().min(1, "Retail markup is required"),
  wholesaleMarkupPercentage: z.string().min(1, "Wholesale markup is required"),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

const calculatePriceSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  supplierCost: z.string().min(1, "Supplier cost is required"),
});

const generatePriceListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["retail", "wholesale", "custom"]),
  customerId: z.string().optional(),
  categoryId: z.string().optional(),
  currency: z.string().default("USD"),
});

export default function PricingManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("categories");

  // Queries
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["/api/product-categories"],
  });

  const { data: markupConfigs = [], isLoading: markupLoading } = useQuery({
    queryKey: ["/api/markup-configurations"],
  });

  const { data: priceLists = [], isLoading: priceListsLoading } = useQuery({
    queryKey: ["/api/price-lists"],
  });

  const { data: itemPricing = [], isLoading: itemPricingLoading } = useQuery({
    queryKey: ["/api/item-pricing"],
  });

  // Forms
  const categoryForm = useForm({
    resolver: zodResolver(createProductCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      parentCategoryId: "",
      retailMarkupPercentage: "",
      wholesaleMarkupPercentage: "",
    },
  });

  const markupForm = useForm({
    resolver: zodResolver(createMarkupConfigSchema),
    defaultValues: {
      level: "System" as const,
      entityId: "",
      retailMarkupPercentage: "",
      wholesaleMarkupPercentage: "",
      effectiveFrom: "",
      effectiveTo: "",
    },
  });

  const priceCalculatorForm = useForm({
    resolver: zodResolver(calculatePriceSchema),
    defaultValues: {
      itemId: "",
      supplierCost: "",
    },
  });

  const priceListForm = useForm({
    resolver: zodResolver(generatePriceListSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "retail" as const,
      customerId: "",
      categoryId: "",
      currency: "USD",
    },
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createProductCategorySchema>) => {
      const response = await fetch("/api/product-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create category");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/product-categories"] });
      toast({ title: "Success", description: "Product category created successfully" });
      categoryForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create category", variant: "destructive" });
    },
  });

  const createMarkupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createMarkupConfigSchema>) => {
      const response = await fetch("/api/markup-configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create markup configuration");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/markup-configurations"] });
      toast({ title: "Success", description: "Markup configuration created successfully" });
      markupForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to create markup configuration", variant: "destructive" });
    },
  });

  const calculatePriceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof calculatePriceSchema>) => {
      const response = await fetch("/api/item-pricing/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to calculate prices");
      return response.json();
    },
    onSuccess: (result: any) => {
      toast({ 
        title: "Price Calculation", 
        description: `Retail: $${result.retailPrice} | Wholesale: $${result.wholesalePrice}` 
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to calculate prices", variant: "destructive" });
    },
  });

  const generatePriceListMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generatePriceListSchema>) => {
      const response = await fetch("/api/price-lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to generate price list");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/price-lists"] });
      toast({ title: "Success", description: "Price list generated successfully" });
      priceListForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to generate price list", variant: "destructive" });
    },
  });

  // Handlers
  const onCreateCategory = (data: z.infer<typeof createProductCategorySchema>) => {
    createCategoryMutation.mutate(data);
  };

  const onCreateMarkup = (data: z.infer<typeof createMarkupConfigSchema>) => {
    createMarkupMutation.mutate(data);
  };

  const onCalculatePrice = (data: z.infer<typeof calculatePriceSchema>) => {
    calculatePriceMutation.mutate(data);
  };

  const onGeneratePriceList = (data: z.infer<typeof generatePriceListSchema>) => {
    generatePriceListMutation.mutate(data);
  };

  const downloadPriceList = async (priceListId: string, name: string) => {
    try {
      const response = await fetch(`/api/price-lists/${priceListId}/download`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to download price list");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "Price list downloaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download price list", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pricing & Costing Engine</h1>
          <p className="text-muted-foreground">
            Manage product categories, markup configurations, and automated pricing calculations
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="categories" data-testid="tab-categories">Product Categories</TabsTrigger>
          <TabsTrigger value="markup" data-testid="tab-markup">Markup Configuration</TabsTrigger>
          <TabsTrigger value="calculator" data-testid="tab-calculator">Price Calculator</TabsTrigger>
          <TabsTrigger value="pricing" data-testid="tab-pricing">Item Pricing</TabsTrigger>
          <TabsTrigger value="price-lists" data-testid="tab-price-lists">Price Lists</TabsTrigger>
        </TabsList>

        {/* Product Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Product Categories</CardTitle>
                  <CardDescription>
                    Organize products into categories with specific markup percentages
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-category">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Product Category</DialogTitle>
                    </DialogHeader>
                    <Form {...categoryForm}>
                      <form onSubmit={categoryForm.handleSubmit(onCreateCategory)} className="space-y-4">
                        <FormField
                          control={categoryForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Electronics, Clothing, etc." {...field} data-testid="input-category-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={categoryForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Category description..." {...field} data-testid="input-category-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={categoryForm.control}
                            name="retailMarkupPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Retail Markup %</FormLabel>
                                <FormControl>
                                  <Input placeholder="25.00" {...field} data-testid="input-category-retail-markup" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={categoryForm.control}
                            name="wholesaleMarkupPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Wholesale Markup %</FormLabel>
                                <FormControl>
                                  <Input placeholder="15.00" {...field} data-testid="input-category-wholesale-markup" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" disabled={createCategoryMutation.isPending} data-testid="button-submit-category">
                          {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {categoriesLoading ? (
                <div className="text-center py-4">Loading categories...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Retail Markup</TableHead>
                      <TableHead>Wholesale Markup</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(categories as any[]).map((category: any) => (
                      <TableRow key={category.id} data-testid={`row-category-${category.id}`}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.description || "-"}</TableCell>
                        <TableCell>{category.retailMarkupPercentage ? `${category.retailMarkupPercentage}%` : "-"}</TableCell>
                        <TableCell>{category.wholesaleMarkupPercentage ? `${category.wholesaleMarkupPercentage}%` : "-"}</TableCell>
                        <TableCell>
                          <Badge variant={category.isActive ? "default" : "secondary"}>
                            {category.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-edit-category-${category.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-delete-category-${category.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Markup Configuration Tab */}
        <TabsContent value="markup" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Markup Configuration</CardTitle>
                  <CardDescription>
                    Configure markup percentages at system, category, or item level
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-markup">
                      <Settings className="h-4 w-4 mr-2" />
                      Create Configuration
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Markup Configuration</DialogTitle>
                    </DialogHeader>
                    <Form {...markupForm}>
                      <form onSubmit={markupForm.handleSubmit(onCreateMarkup)} className="space-y-4">
                        <FormField
                          control={markupForm.control}
                          name="level"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Configuration Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-markup-level">
                                    <SelectValue placeholder="Select level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="System">System-wide</SelectItem>
                                  <SelectItem value="Category">Category-specific</SelectItem>
                                  <SelectItem value="Item">Item-specific</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={markupForm.control}
                            name="retailMarkupPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Retail Markup %</FormLabel>
                                <FormControl>
                                  <Input placeholder="30.00" {...field} data-testid="input-markup-retail" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={markupForm.control}
                            name="wholesaleMarkupPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Wholesale Markup %</FormLabel>
                                <FormControl>
                                  <Input placeholder="20.00" {...field} data-testid="input-markup-wholesale" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" disabled={createMarkupMutation.isPending} data-testid="button-submit-markup">
                          {createMarkupMutation.isPending ? "Creating..." : "Create Configuration"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {markupLoading ? (
                <div className="text-center py-4">Loading markup configurations...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Level</TableHead>
                      <TableHead>Entity ID</TableHead>
                      <TableHead>Retail Markup</TableHead>
                      <TableHead>Wholesale Markup</TableHead>
                      <TableHead>Effective Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(markupConfigs as any[]).map((config: any) => (
                      <TableRow key={config.id} data-testid={`row-markup-${config.id}`}>
                        <TableCell>
                          <Badge variant="outline">{config.level}</Badge>
                        </TableCell>
                        <TableCell>{config.entityId || "N/A"}</TableCell>
                        <TableCell>{config.retailMarkupPercentage}%</TableCell>
                        <TableCell>{config.wholesaleMarkupPercentage}%</TableCell>
                        <TableCell>
                          {new Date(config.effectiveFrom).toLocaleDateString()} - {config.effectiveTo ? new Date(config.effectiveTo).toLocaleDateString() : "Ongoing"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={config.isActive ? "default" : "secondary"}>
                            {config.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" data-testid={`button-edit-markup-${config.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Calculator Tab */}
        <TabsContent value="calculator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Calculator</CardTitle>
              <CardDescription>
                Calculate retail and wholesale prices based on supplier cost and markup configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...priceCalculatorForm}>
                <form onSubmit={priceCalculatorForm.handleSubmit(onCalculatePrice)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={priceCalculatorForm.control}
                      name="itemId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Item ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter item ID" {...field} data-testid="input-calculator-item-id" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={priceCalculatorForm.control}
                      name="supplierCost"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Supplier Cost ($)</FormLabel>
                          <FormControl>
                            <Input placeholder="100.00" {...field} data-testid="input-calculator-supplier-cost" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={calculatePriceMutation.isPending} data-testid="button-calculate-price">
                    <Calculator className="h-4 w-4 mr-2" />
                    {calculatePriceMutation.isPending ? "Calculating..." : "Calculate Prices"}
                  </Button>
                </form>
              </Form>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Pricing Formula</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Retail Price</strong> = Supplier Cost / (1 - Retail Markup %)
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Wholesale Price</strong> = Supplier Cost / (1 - Wholesale Markup %)
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Item Pricing Tab */}
        <TabsContent value="pricing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Pricing</CardTitle>
              <CardDescription>
                View and manage calculated prices for all items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {itemPricingLoading ? (
                <div className="text-center py-4">Loading item pricing...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item ID</TableHead>
                      <TableHead>Supplier Cost</TableHead>
                      <TableHead>Retail Price</TableHead>
                      <TableHead>Wholesale Price</TableHead>
                      <TableHead>Manual Override</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(itemPricing as any[]).map((pricing: any) => (
                      <TableRow key={pricing.id} data-testid={`row-pricing-${pricing.id}`}>
                        <TableCell className="font-medium">{pricing.itemId}</TableCell>
                        <TableCell>${pricing.supplierCost}</TableCell>
                        <TableCell>${pricing.retailPrice}</TableCell>
                        <TableCell>${pricing.wholesalePrice}</TableCell>
                        <TableCell>
                          <Badge variant={pricing.isManualOverride ? "destructive" : "secondary"}>
                            {pricing.isManualOverride ? "Manual" : "Calculated"}
                          </Badge>
                        </TableCell>
                        <TableCell>{pricing.currency}</TableCell>
                        <TableCell>
                          <Badge variant={pricing.isActive ? "default" : "secondary"}>
                            {pricing.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Price Lists Tab */}
        <TabsContent value="price-lists" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Price Lists</CardTitle>
                  <CardDescription>
                    Generate and manage downloadable price lists for customers
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-price-list">
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Price List
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Generate Price List</DialogTitle>
                    </DialogHeader>
                    <Form {...priceListForm}>
                      <form onSubmit={priceListForm.handleSubmit(onGeneratePriceList)} className="space-y-4">
                        <FormField
                          control={priceListForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price List Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Q1 2024 Retail Prices" {...field} data-testid="input-price-list-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={priceListForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price List Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-price-list-type">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="retail">Retail</SelectItem>
                                  <SelectItem value="wholesale">Wholesale</SelectItem>
                                  <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={priceListForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Price list description..." {...field} data-testid="input-price-list-description" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={generatePriceListMutation.isPending} data-testid="button-submit-price-list">
                          {generatePriceListMutation.isPending ? "Generating..." : "Generate Price List"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {priceListsLoading ? (
                <div className="text-center py-4">Loading price lists...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Generated Date</TableHead>
                      <TableHead>Downloads</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(priceLists as any[]).map((priceList: any) => (
                      <TableRow key={priceList.id} data-testid={`row-price-list-${priceList.id}`}>
                        <TableCell className="font-medium">{priceList.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{priceList.type}</Badge>
                        </TableCell>
                        <TableCell>{priceList.currency}</TableCell>
                        <TableCell>
                          {priceList.generatedAt ? new Date(priceList.generatedAt).toLocaleDateString() : "-"}
                        </TableCell>
                        <TableCell>{priceList.downloadCount || 0}</TableCell>
                        <TableCell>
                          <Badge variant={priceList.isActive ? "default" : "secondary"}>
                            {priceList.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => downloadPriceList(priceList.id, priceList.name)}
                              data-testid={`button-download-price-list-${priceList.id}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-edit-price-list-${priceList.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}