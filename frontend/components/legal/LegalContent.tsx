/* ─────────────────────────────────────────────────────────────
   Contenido legal compartido por las rutas /terms, /privacy
   y por el modal rápido del Footer.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";

export const LEGAL_UPDATED = "14 de octubre de 2026";

function H({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[19px] font-semibold text-[#222222] mt-8 mb-2">
      {children}
    </h2>
  );
}
function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-[15px] font-semibold text-[#222222] mt-4 mb-1">
      {children}
    </h3>
  );
}
function P({ children }: { children: ReactNode }) {
  return <p className="text-[14px] leading-relaxed text-[#444444] mb-3">{children}</p>;
}
function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 mb-3 text-[14px] leading-relaxed text-[#444444] marker:text-[#ff385c]">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function TermsContent() {
  return (
    <article>
      <P>
        Bienvenido a RealtyHub. Al acceder o utilizar nuestro portal
        inmobiliario aceptas estos Términos y Condiciones. Si no estás de
        acuerdo con ellos, te pedimos no utilizar la plataforma.
      </P>

      <H>1. Definiciones</H>
      <UL
        items={[
          <><strong>Plataforma:</strong> el sitio web y los servicios de RealtyHub.</>,
          <><strong>Usuario:</strong> toda persona que navega, se registra o solicita información.</>,
          <><strong>Agente:</strong> profesional inmobiliario autorizado para gestionar listados, leads y visitas.</>,
          <><strong>Listado:</strong> publicación de un inmueble en venta o alquiler.</>,
        ]}
      />

      <H>2. Uso adecuado del portal</H>
      <P>El usuario se compromete a utilizar la plataforma de forma lícita y de buena fe. Está prohibido:</P>
      <UL
        items={[
          "Suplantar la identidad de otra persona o proporcionar datos falsos.",
          "Extraer información de forma masiva (scraping) o automatizada sin autorización.",
          "Intentar vulnerar la seguridad, los tokens de sesión o los sistemas de RealtyHub.",
          "Publicar contenido ofensivo, fraudulento o que infrinja derechos de terceros.",
          "Usar los datos de contacto de agentes o propietarios para fines distintos a la gestión inmobiliaria.",
        ]}
      />

      <H>3. Veracidad de los listados</H>
      <P>
        Los agentes y propietarios son responsables de que la información de
        cada inmueble (precio, área, ubicación, estado legal, fotografías y
        disponibilidad) sea veraz y esté actualizada. RealtyHub puede
        revisar, modificar o retirar listados que parezcan inexactos o
        engañosos.
      </P>
      <P>
        Las imágenes y descripciones tienen carácter informativo. Recomendamos
        verificar presencialmente el inmueble y su documentación (certificado
        de tradición y libertad, paz y salvos, etc.) antes de cualquier
        negociación. Los precios pueden cambiar sin previo aviso.
      </P>

      <H>4. Agendamiento de visitas</H>
      <UL
        items={[
          "Las visitas se solicitan mediante la plataforma y quedan sujetas a la confirmación del agente asignado.",
          "El usuario debe presentarse puntualmente y avisar con antelación si necesita cancelar o reprogramar.",
          "El agente puede cancelar una visita por indisponibilidad del inmueble o razones de seguridad.",
          "Agendar una visita no constituye una oferta, reserva ni compromiso de compra o arriendo.",
        ]}
      />

      <H>5. Responsabilidades de agentes y usuarios</H>
      <H3>Agentes</H3>
      <UL
        items={[
          "Mantener actualizados los listados, leads y el estado de las visitas.",
          "Tratar los datos personales de los clientes conforme a la Política de Privacidad.",
          "Actuar con honestidad, transparencia y respeto en toda comunicación.",
          "Custodiar sus credenciales de acceso; toda actividad realizada con ellas se presume propia.",
        ]}
      />
      <H3>Usuarios</H3>
      <UL
        items={[
          "Suministrar información de contacto correcta al enviar formularios.",
          "Cuidar los inmuebles visitados y seguir las indicaciones del agente.",
          "Verificar por su cuenta las condiciones de cualquier negocio antes de formalizarlo.",
        ]}
      />
      <P>
        RealtyHub actúa como intermediario tecnológico; no es parte de los
        contratos de compraventa o arrendamiento que se celebren entre las
        partes y no garantiza el cierre de negociaciones.
      </P>

      <H>6. Propiedad intelectual</H>
      <P>
        La marca RealtyHub, el logotipo, el diseño, el código y los contenidos
        originales de la plataforma son propiedad de RealtyHub o de sus
        licenciantes. Queda prohibida su reproducción, distribución o
        modificación sin autorización escrita. Al publicar fotografías o
        textos, el agente declara tener los derechos necesarios y otorga a
        RealtyHub una licencia no exclusiva para mostrarlos en la plataforma.
      </P>

      <H>7. Limitación de responsabilidad</H>
      <P>
        La plataforma se ofrece «tal cual». RealtyHub no responde por
        interrupciones del servicio, errores en la información suministrada
        por terceros ni por daños derivados de negociaciones entre usuarios,
        en la medida permitida por la ley.
      </P>

      <H>8. Suspensión de cuentas</H>
      <P>
        Podemos suspender o cancelar cuentas que incumplan estos términos, sin
        perjuicio de las acciones legales que correspondan.
      </P>

      <H>9. Modificaciones y ley aplicable</H>
      <P>
        Podemos actualizar estos términos; la versión vigente estará siempre
        publicada en esta página. Se rigen por las leyes de la República de
        Colombia. Para dudas escríbenos a{" "}
        <a className="text-[#ff385c] underline" href="mailto:soporte@realtyhub.com">
          soporte@realtyhub.com
        </a>
        .
      </P>
    </article>
  );
}

export function PrivacyContent() {
  return (
    <article>
      <P>
        En RealtyHub valoramos tu privacidad. Esta política explica qué datos
        recolectamos, cómo los usamos y cuáles son tus derechos, de acuerdo con
        la Ley 1581 de 2012 de protección de datos personales de Colombia.
      </P>

      <H>1. Datos que recolectamos</H>
      <H3>Formularios de contacto (leads)</H3>
      <UL
        items={[
          "Nombre completo, correo electrónico y teléfono.",
          "Inmueble de interés y mensaje enviado.",
          "Preferencias de fecha y hora para visitas.",
        ]}
      />
      <H3>Registro y cuenta</H3>
      <UL
        items={[
          "Nombre, correo electrónico, rol y oficina (para agentes y personal).",
          "Credenciales de acceso, almacenadas de forma cifrada (hash).",
        ]}
      />
      <H3>Datos técnicos</H3>
      <UL
        items={[
          "Dirección IP, tipo de navegador y dispositivo, y páginas visitadas.",
          "Preferencias locales, como tus propiedades favoritas.",
        ]}
      />

      <H>2. Finalidades del tratamiento</H>
      <UL
        items={[
          "Gestionar tus solicitudes de información y agendar visitas con un agente.",
          "Administrar tu cuenta y autenticar el acceso a la plataforma.",
          "Mejorar la plataforma y prevenir fraudes o usos indebidos.",
          "Enviarte comunicaciones relacionadas con tu solicitud y, si lo autorizas, novedades comerciales.",
        ]}
      />

      <H>3. Cookies y tokens de sesión (JWT)</H>
      <P>
        Usamos un token de sesión JWT (JSON Web Token) para mantener tu sesión
        iniciada de forma segura. Este token es firmado, tiene vencimiento y
        se elimina al cerrar sesión. Además podemos usar almacenamiento local
        del navegador para recordar preferencias. Puedes borrar o bloquear
        cookies desde tu navegador, aunque algunas funciones —como el acceso
        de agentes— podrían dejar de funcionar.
      </P>

      <H>4. Compartición de datos</H>
      <P>
        No vendemos tu información. Solo la compartimos con el agente u oficina
        responsable de tu solicitud, con proveedores tecnológicos que operan
        bajo acuerdos de confidencialidad, o cuando una autoridad competente
        lo exija legalmente.
      </P>

      <H>5. Protección y conservación</H>
      <UL
        items={[
          "Comunicaciones cifradas mediante HTTPS.",
          "Contraseñas almacenadas con algoritmos de hash seguros.",
          "Control de acceso por roles (agente, gerente y administrador).",
          "Conservamos los datos solo durante el tiempo necesario para las finalidades descritas o las obligaciones legales.",
        ]}
      />

      <H>6. Tus derechos</H>
      <P>Como titular de los datos puedes en cualquier momento:</P>
      <UL
        items={[
          "Conocer, acceder y consultar tus datos personales.",
          "Actualizar o rectificar información inexacta.",
          "Solicitar la supresión de tus datos o revocar tu autorización.",
          "Solicitar prueba de la autorización otorgada.",
          "Presentar quejas ante la Superintendencia de Industria y Comercio.",
        ]}
      />
      <P>
        Para ejercer estos derechos escribe a{" "}
        <a className="text-[#ff385c] underline" href="mailto:soporte@realtyhub.com">
          soporte@realtyhub.com
        </a>
        ; responderemos en los plazos que establece la ley.
      </P>

      <H>7. Menores de edad</H>
      <P>
        La plataforma no está dirigida a menores de 18 años y no recolectamos
        sus datos de forma intencional.
      </P>

      <H>8. Cambios a esta política</H>
      <P>
        Publicaremos cualquier cambio en esta página, indicando la fecha de la
        última actualización.
      </P>
    </article>
  );
}
