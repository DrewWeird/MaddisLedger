using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MaddisLedger.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddInvoiceMultiCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Currency",
                table: "Invoices",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExchangeRateAsOf",
                table: "Invoices",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ExchangeRateToZar",
                table: "Invoices",
                type: "decimal(18,6)",
                precision: 18,
                scale: 6,
                nullable: false,
                defaultValue: 1m);

            migrationBuilder.AddColumn<int>(
                name: "DefaultCurrency",
                table: "Customers",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ExchangeRateAsOf",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "ExchangeRateToZar",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DefaultCurrency",
                table: "Customers");
        }
    }
}
