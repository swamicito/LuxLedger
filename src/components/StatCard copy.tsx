import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  trend?: number;
  format?: 'currency' | 'number' | 'percentage';
  className?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  trend, 
  format = 'number',
  className = "" 
}: StatCardProps) {
  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString()}`;
      case 'percentage':
        return `${val.toFixed(1)}%`;
      default:
        return val.toLocaleString();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={className}
    >
      <Card className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-400">{title}</p>
              <p className="text-2xl font-bold text-white mt-2">
                {formatValue(value)}
              </p>
              {trend !== undefined && (
                <p className={`text-sm mt-1 ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trend >= 0 ? '+' : ''}{trend.toFixed(1)}% from last month
                </p>
              )}
            </div>
            {icon && (
              <div className="text-yellow-400">
                {icon}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
