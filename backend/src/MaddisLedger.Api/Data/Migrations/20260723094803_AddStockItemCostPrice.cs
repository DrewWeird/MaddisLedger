using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MaddisLedger.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddStockItemCostPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CostPrice",
                table: "StockItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CostPriceSnapshot",
                table: "InvoiceLineItems",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostPrice",
                table: "StockItems");

            migrationBuilder.DropColumn(
                name: "CostPriceSnapshot",
                table: "InvoiceLineItems");
        }
    }
}
