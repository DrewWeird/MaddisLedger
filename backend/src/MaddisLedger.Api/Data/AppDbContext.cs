using Microsoft.EntityFrameworkCore;
using MaddisLedger.Api.Entities;

namespace MaddisLedger.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<StockItem> StockItems => Set<StockItem>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<BusinessProfile> BusinessProfiles => Set<BusinessProfile>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLineItem> InvoiceLineItems => Set<InvoiceLineItem>();
    public DbSet<DeliveryNote> DeliveryNotes => Set<DeliveryNote>();
    public DbSet<DeliveryNoteLineItem> DeliveryNoteLineItems => Set<DeliveryNoteLineItem>();
    public DbSet<DocumentCounter> DocumentCounters => Set<DocumentCounter>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<SupplierInvoice> SupplierInvoices => Set<SupplierInvoice>();
    public DbSet<SupplierPayment> SupplierPayments => Set<SupplierPayment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<StockItem>(entity =>
        {
            entity.HasIndex(e => e.Code).IsUnique();
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.CostPrice).HasPrecision(18, 2);
        });

        modelBuilder.Entity<Customer>();

        modelBuilder.Entity<BusinessProfile>();

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.Property(e => e.Total).HasPrecision(18, 2);
            entity.Property(e => e.ExchangeRateToZar).HasPrecision(18, 6);

            entity.HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.LineItems)
                .WithOne(l => l.Invoice)
                .HasForeignKey(l => l.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.DeliveryNotes)
                .WithOne(d => d.Invoice)
                .HasForeignKey(d => d.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<InvoiceLineItem>(entity =>
        {
            entity.Property(e => e.UnitPriceSnapshot).HasPrecision(18, 2);
            entity.Property(e => e.CostPriceSnapshot).HasPrecision(18, 2);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);

            entity.HasOne(e => e.StockItem)
                .WithMany()
                .HasForeignKey(e => e.StockItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DeliveryNote>(entity =>
        {
            entity.HasIndex(e => e.DeliveryNoteNumber).IsUnique();

            entity.HasOne(e => e.Customer)
                .WithMany()
                .HasForeignKey(e => e.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.LineItems)
                .WithOne(l => l.DeliveryNote)
                .HasForeignKey(l => l.DeliveryNoteId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<DeliveryNoteLineItem>(entity =>
        {
            entity.HasOne(e => e.InvoiceLineItem)
                .WithMany(l => l.DeliveryNoteLineItems)
                .HasForeignKey(e => e.InvoiceLineItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DocumentCounter>(entity =>
        {
            entity.HasKey(e => e.DocumentType);
        });

        modelBuilder.Entity<Supplier>();

        modelBuilder.Entity<SupplierInvoice>(entity =>
        {
            entity.Property(e => e.Total).HasPrecision(18, 2);

            entity.HasOne(e => e.Supplier)
                .WithMany()
                .HasForeignKey(e => e.SupplierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Payments)
                .WithOne(p => p.SupplierInvoice)
                .HasForeignKey(p => p.SupplierInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<SupplierPayment>(entity =>
        {
            entity.Property(e => e.Amount).HasPrecision(18, 2);
        });
    }
}
