interface MetricCardProps {
    title: string
    value: string
    change?: string
    positive?: boolean
  }
  
  const MetricCard = ({ title, value, change, positive }: MetricCardProps) => {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-2 border border-gray-100">
        <p className="text-sm text-gray-500">{title}</p>
        <div className="flex items-end justify-between">
          <h3 className="text-2xl font-semibold text-gray-800">{value}</h3>
          {change && (
            <span
              className={`text-sm font-medium ${
                positive ? "text-green-500" : "text-red-500"
              }`}
            >
              {change}
            </span>
          )}
        </div>
      </div>
    )
  }
  
  export default MetricCard
  