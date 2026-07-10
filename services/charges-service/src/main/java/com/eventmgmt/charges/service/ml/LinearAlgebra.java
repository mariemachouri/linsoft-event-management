package com.eventmgmt.charges.service.ml;

public final class LinearAlgebra {
    private LinearAlgebra() {}

    /** Résout Ax = b (A carrée n x n) par élimination de Gauss-Jordan avec pivot partiel. */
    public static double[] solve(double[][] a, double[] b) {
        int n = b.length;
        double[][] m = new double[n][n + 1];
        for (int i = 0; i < n; i++) {
            System.arraycopy(a[i], 0, m[i], 0, n);
            m[i][n] = b[i];
        }

        for (int col = 0; col < n; col++) {
            int pivot = col;
            for (int row = col + 1; row < n; row++) {
                if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
            }
            double[] tmp = m[col];
            m[col] = m[pivot];
            m[pivot] = tmp;

            double diag = m[col][col];
            if (Math.abs(diag) < 1e-12) diag = 1e-12;
            for (int j = col; j <= n; j++) m[col][j] /= diag;

            for (int row = 0; row < n; row++) {
                if (row == col) continue;
                double factor = m[row][col];
                if (factor == 0.0) continue;
                for (int j = col; j <= n; j++) m[row][j] -= factor * m[col][j];
            }
        }

        double[] x = new double[n];
        for (int i = 0; i < n; i++) x[i] = m[i][n];
        return x;
    }
}
