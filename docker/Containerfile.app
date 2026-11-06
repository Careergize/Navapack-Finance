ARG BASE_IMAGE=navapack-finance-base:16.53.0-frappe16.55.1
FROM ${BASE_IMAGE}
USER frappe
COPY --chown=frappe:0 backend/navapack_finance /home/frappe/frappe-bench/apps/navapack_finance
RUN ./env/bin/pip install --no-deps -e apps/navapack_finance \
 && printf 'frappe\nerpnext\nnavapack_finance\n' > sites/apps.txt \
 && bench build --production \
 && cp -a sites/assets/. assets/
