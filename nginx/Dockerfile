FROM sameersbn/nginx:1.15.8
RUN mkdir -p /var/cache/nginx

#ENV NPS_RELEASE_NUMBER=1.13.35.2 \
#    NPS_VERSION=1.13.35.2-stable \
#    NGINX_VERSION=nginx-1.14.2 \
#    OPENSSL_VERSION=openssl-1.1.1a
#
##ENV HOST 0.0.0.0
#
#COPY assets/ /tmp/
##RUN cd /tmp && chmod +x /tmp/install.sh && bash install.sh && chmod 755 /sbin/entrypoint.sh
#RUN cd /tmp  && chmod +x /tmp/install.sh && ls -la && bash install.sh
#COPY entrypoint.sh /sbin/entrypoint.sh
#RUN chmod 755 /sbin/entrypoint.sh
#ENTRYPOINT ["/sbin/entrypoint.sh"]
#CMD ["/usr/sbin/nginx"]


#ENTRYPOINT ["/usr/sbin/init"]
#CMD ["systemctl "]
#COPY ./nginx.service /lib/systemd/system/nginx.service
#COPY ./nginx /etc/init.d/nginx

#RUN cd /tmp \
# && apt-get update \
# && apt-get install -y build-essential zlib1g-dev libpcre3 libpcre3-dev unzip uuid-dev wget libssl-dev \
# && cd /tmp \
# && NPS_RELEASE_NUMBER="1.13.35.2" \
# && NPS_VERSION=${NPS_RELEASE_NUMBER}-stable \
#&& NGINX_VERSION=nginx-1.14.2 \
#&& OPENSSL_VERSION=openssl-1.1.1a \



#&& wget "https://github.com/apache/incubator-pagespeed-ngx/archive/v"${NPS_VERSION}".zip" \
#&& unzip v${NPS_VERSION}.zip \
#&& nps_dir=incubator-pagespeed-ngx-${NPS_VERSION} \
#&& ls -la \
#&& cd "$nps_dir" \
#&& wget https://dl.google.com/dl/page-speed/psol/${NPS_RELEASE_NUMBER}-x64.tar.gz \
#&& tar -xzvf ${NPS_RELEASE_NUMBER}-x64.tar.gz \

#&& cd /tmp \
#&& wget http://www.openssl.org/source/${OPENSSL_VERSION}.tar.gz \
#&& tar -xvzf ${OPENSSL_VERSION}.tar.gz \
#&& cd ${OPENSSL_VERSION} \
#&& ./config --prefix=/usr/local/openssl --openssldir=/usr/local/openssl \
#&& make \
#&& make install \
#&& echo "openssl install " && openssl -v \


#&& cd /tmp \
#&& wget nginx.org/download/${NGINX_VERSION}.tar.gz \
#&& tar ${NGINX_VERSION}.tar.gz \
#&& cd ${NGINX_VERSION} \
#&& ./configure --conf-path=/etc/nginx/nginx.conf --error-log-path=/var/log/nginx/error.log --sbin-path=/usr/sbin/nginx --pid-path=/var/run/nginx.pid --lock-path=/var/lock/nginx.lock --http-log-path=/var/log/nginx/access.log --http-client-body-temp-path=/var/lib/nginx/body --http-proxy-temp-path=/var/lib/nginx/proxy --http-fastcgi-temp-path=/var/lib/nginx/fastcgi --http-uwsgi-temp-path=/var/lib/nginx/uwsgi --http-scgi-temp-path=/var/lib/nginx/scgi --prefix=/var/lib/nginx --with-http_stub_status_module --with-http_flv_module --with-http_ssl_module --with-http_dav_module --with-http_sub_module --with-http_realip_module --with-http_gzip_static_module --with-http_secure_link_module --with-ipv6 --with-debug --add-module=/tmp/${nps_dir} \
#&& make \
#&& make install \
#&& echo "nginx install complete" && nginx -v \
#&& nginx -v && nginx -V \
#&& nginx -t \


 #&& cd /etc/init.d/ && ls -la \
 # && cd
 # && chmod +x /etc/init.d/nginx && ls -la \
 # && update-rc.d -f nginx defaults \
 # && /etc/init.d/nginx restart \

 #&& ps aux \
 #&& systemctl start nginx.service && systemctl enable nginx.service \
#
 #&& echo "clean " && nginx -v \
 #&& echo "df " && df \
 #&& apt-get purge -y build-essential zlib1g-dev libpcre3 libpcre3-dev unzip uuid-dev wget libssl-dev \
 #&& aptitude purge -y build-essential zlib1g-dev libpcre3 libpcre3-dev unzip uuid-dev wget libssl-dev \
 #&& apt-get autoremove \
 #&& echo "df " && df \
 #CMD ["systemctl start nginx.service"]

 ##&& /etc/init.d/nginx restart
 #https://dl.google.com/dl/page-speed/psol/1.13.35.2.tar.gz
 #https://dl.google.com/dl/page-speed/psol/1.7.30.1.tar.gz

 #NPS_RELEASE_NUMBER=${1.13.35.2-stable/stable/} && psol_url=https://dl.google.com/dl/page-speed/psol/${NPS_RELEASE_NUMBER}.tar.gz [ -e scripts/format_binary_url.sh ] && echo ${psol_url}