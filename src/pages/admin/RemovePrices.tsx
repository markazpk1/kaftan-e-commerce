import { useState } from "react";
import { productService } from "@/lib/productService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";

const RemovePrices = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; updated: number; error?: string } | null>(null);

  const handleRemovePrices = async () => {
    if (!confirm("⚠️ Are you sure you want to remove all prices from all products? This action cannot be undone!")) {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await productService.removeAllPrices();
      setResult(response);
    } catch (error) {
      setResult({ success: false, updated: 0, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500" />
            Remove All Product Prices
          </CardTitle>
          <CardDescription>
            This will set all product prices to $0 and remove original prices. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Warning:</strong> This will permanently remove all pricing information from your database.
              All products will show "Price on Request" instead of actual prices.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleRemovePrices}
            disabled={loading}
            variant="destructive"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing prices...
              </>
            ) : (
              "Remove All Prices"
            )}
          </Button>

          {result && (
            <Alert className={result.success ? "border-green-500" : "border-red-500"}>
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <AlertDescription>
                {result.success ? (
                  <div>
                    <strong>Success!</strong> Successfully removed prices from {result.updated} products.
                    All products now have $0 price and no original price.
                  </div>
                ) : (
                  <div>
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RemovePrices;
