<?php
namespace App\Twig;

use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Class FontAwesomeExtension
 */
class FontAwesomeExtension extends AbstractExtension
{
    /**
     * Icon names which are aliases to real icon names. An optional
     * css class can be specified by separating the real icon name
     * by the classes, i.e. "gem far" and "circle fa online".
     */
    const ICON_ALIASES = [];

    /**
     * @return TwigFunction[]
     */
    public function getFunctions()
    {
        return [
            new TwigFunction('icon', [$this, 'icon'], ['is_safe' => ['html']])
        ];
    }

    /**
     * Returns the html for a Font Awesome icon
     *
     * @param string $id      The name of the icon
     * @param string $classes Additional classes applied to the tag, space separate, see
     * @param string $title   Value for the tag title attribute
     *
     * @return string
     */
    public function icon($id, $classes = "fa", $title = "")
    {
        if ($title) {
            $title = htmlspecialchars($title, ENT_HTML5 | ENT_QUOTES);
            $title = " title=\"{$title}\"";
        }

        if (isset(self::ICON_ALIASES[$id])) {
            $parts = explode(' ', self::ICON_ALIASES[$id], 2);
            $id = array_shift($parts);
            if ($parts) {
                $classes = $parts[0];
            }
        }

        return sprintf('<i class="icon %s fa-%s"%s></i>', $classes, $id, $title);
    }
}
